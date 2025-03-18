---
title: sync.Map源码解析
author: Hbzhtd
categories:
  - Golang
tags:
  - Golang
  - 源码解析
top_img: false
date: 2024-03-03 13:02:24
cover: https://hbzhtd.oss-cn-beijing.aliyuncs.com/imags/RedLeaf.png
sticky:

---

```go
type Map struct {
    mu Mutex // 互斥锁, 用于锁定dirty map
    read atomic.Value //atomic.Value 有两个方法，Load 和 Store，用于加载和存储值。 read中实际存储 readOnly
    dirty map[interface{}]*entry // dirty是一个当前最新的map，允许读写
    misses int // 未命中次数 >= len(dirty) 提升dirty
} 
```



```go
type readOnly struct {
    m       map[interface{}]*entry // entry
    amended bool // 存在数据在dirty不在read，该值为true
}
```

```go
type entry struct {
    // nil: 表示被删除，dirty调用Delete()会将read map中的元素置为nil
    // expunged: 表示被删除，但是该键只在read而没有在dirty中，这种情况出现在将read复制到dirty中，即复制的过程会先将nil标记为expunged，然后不将其复制到dirty
    // 正常值: 表示存着真正的数据
    p unsafe.Pointer // *interface{}
}
```

1. read map和dirty都为空.  新增数据写入dirty map
2. misses次数 >= len(dirtry) ,提升dirty, 将dirty拷贝到 read

* 增

    1. 直接操作dirty

* 删除

    1. read中存在该元素, 直接置为nil

       a.  amended = false (dirty 中不存在该元素)

       b. amended = true ( dirty 中存在该元素) 此时dirty和read中同时为nil

    2. read中不存在该元素, 该元素刚刚写入dirty且未升级成read,

       直接调用delete删除dirty中该元素

##### **优化点**

1. 空间换时间。通过冗余的两个数据结构(read、dirty),实现加锁对性能的影响。

2. 使用只读数据(read)，避免读写冲突。

3. 动态调整，miss次数多了之后，将dirty数据提升为read。

4. double-checking（双重检测）。

5. 延迟删除。 删除一个键值只是打标记，只有在提升dirty的时候才清理删除的数据。

6. 优先从read读取、更新、删除，因为对read的读取不需要锁。

##### 源码分析

1. Load 读取

```go
func (m *Map) Load(key interface{}) (value interface{}, ok bool) {
    // 第一次检测元素是否存在
    read, _ := m.read.Load().(readOnly) // 加载read字段并转换成readOnly类型
    e, ok := read.m[key]
    if !ok && read.amended { // read中不存在 & dirty中存在read中不存在的元素
        m.mu.Lock() // 为dirty map 加锁
        
        // 第二次检测，防止在加锁的过程中,dirty map转换成read map,从而导致读取不到数据
        read, _ = m.read.Load().(readOnly)
        e, ok = read.m[key]
        if !ok && read.amended { // read中不存在 & dirty中存在read中不存在的元素
            e, ok = m.dirty[key] // 此时直接从dirty中读
            // 不论元素是否存在，均需要记录miss数，以便dirty map升级为read map
            m.missLocked() // 1.misses++ 2.判断dirty是否提升 3.dirty提升逻辑
        }
        // 解锁
        m.mu.Unlock() 
    }
    // 元素不存在直接返回
    if !ok {
        return nil, false
    }
    return e.load() // 通过绑定的load方法查看p的三种状态: nil, expunged, 正常值
}
```

* missLocked

```go
func (m *Map) missLocked() {
    m.misses++ // misses自增1
    // 判断dirty map是否可以升级为read map
    if m.misses < len(m.dirty) {
        return
    }
    
    m.read.Store(readOnly{m: m.dirty}) // dirty map升级为read map
    
    m.dirty = nil // dirty map 清空
    
    m.misses = 0 // misses重置为0
}
```

* load: 绑定在 *entry 上的方法

```go
func (e *entry) load() (value interface{}, ok bool) {
    p := atomic.LoadPointer(&e.p) // 取出p指针
    // 元素不存在或者被删除，则直接返回
    if p == nil || p == expunged {
        return nil, false
    }
    return *(*interface{})(p), true // 强转 + 解引用
}
```

2. store 增加和修改

   ```go
   func (m *Map) Store(key, value interface{}) {
       // 如果read存在这个键，并且这个entry没有被标记删除，尝试直接写入,写入成功，则结束
       // 第一次检测
       read, _ := m.read.Load().(readOnly) 
       if e, ok := read.m[key]; ok && e.tryStore(&value) { // 如果read中存在key, 判断p是否为expunged, 不为expunged 更新value 直接返回
           return
       }
      	// 此时会有两种情况 1. read中没有key,在dirty中写 2. read有key, 但p = expunged, 需要更新dirty
       // 所以都要对dirty进行操作
       m.mu.Lock() // 上锁
       // 第二次检测
       read, _ = m.read.Load().(readOnly)
       if e, ok := read.m[key]; ok { // read 存在 key
           // 如果元素被标识为expunged 修改read的expunged为nil
           if e.unexpungeLocked() {
               
               m.dirty[key] = e // 值的指针相同
           } 
           // 更新read map 元素值
           e.storeLocked(&value) // read和dirty同时修改,此时的e为read的指针
       } else if e, ok := m.dirty[key]; ok {
           // 此时read map没有该元素，但是dirty map有该元素，并需修改dirty map元素值为最新值
           // 添加操作
           e.storeLocked(&value) // 直接操作dirty,此时的e为dirty的指针
       } else { // key两者都不在, 是一个新的key
           if !read.amended { // amended = false, 表明dirty 中的key在 read中都存在
               //此时就是判断dirty是否为空, 因为当发生了dirty提升时,dirty的所有key都在read中
               //提升完后, dirty会被置为nil, 所以这里amended = false代表dirty为空
               m.dirtyLocked() // 根据read重置dirty, 保证dirty包含map中所有key
               // 设置read.amended==true，说明dirty map有数据
               m.read.Store(readOnly{m: read.m, amended: true}) 
               // 创建了一个新的readOnly对象, 保留原有数据并且amended为true
               // amended为true 因为接下来dirty中要插入新值,且这个值不存在于read
           }
           // 设置元素进入dirty map，此时dirty map拥有read map和最新设置的元素
           m.dirty[key] = newEntry(value)
       }
       // 解锁，有人认为锁的范围有点大，假设read map数据很大，那么执行m.dirtyLocked()会耗费花时间较多，完全可以在操作dirty map时才加锁，这样的想法是不对的，因为m.dirtyLocked()中有写入操作
       m.mu.Unlock()
   }
   ```

* tryStore

  ```go
  func (e *entry) tryStore(i *interface{}) bool {   
      }
  	// 通过使用 for 循环，可以在竞态条件发生时重新尝试写入操作，直到成功为止。
      for {
          p := atomic.LoadPointer(&e.p) // 取出p
          // expunged: dirty不为空, 且dirty不存在该key,此时不能直接修改read,还要更新dirty
          if p == expunged { 
              return false
          }    ;
          
          // 原子操作更新value(read 和 dirty 都被更新)
          if atomic.CompareAndSwapPointer(&e.p, p, unsafe.Pointer(i)) {
              return true
          }
          // 此时p为 nil || 正常值
          // 当p为nil时:
          // a. dirty为空(return false)
          // b. dirty存在该key, 修改read会同时修改dirty(正常值同等)
          // 原子操作更新value:
          // 1. 获取 e.p 的当前值。
  		// 2. 将获取到的值与 p 进行比较。
  		// 3. 如果两个指针的值相等，则将 e.p 的值替换为 unsafe.Pointer(i)。
  		// 4. 返回替换操作的结果，表示替换是否成功。
      }
  }
  ```

* unexpungeLocked

  ```go
  func (e *entry) unexpungeLocked() (wasExpunged bool) {
      // 1. 检查 e.p 的当前值是否与 expunged 相等。
  	// 2. 如果相等，将 e.p 的值替换为 nil，并返回 true 表示替换成功。
  	// 3. 如果不相等，不进行替换，直接返回 false 表示替换失败。
      // 通过这个原子操作，可以确保在并发情况下，只有一个 goroutine 成功地将 e.p 的值从 expunged 替		换为 nil。其他 goroutine 将获得替换失败的结果。
      return atomic.CompareAndSwapPointer(&e.p, expunged, nil)
  }
  ```

* storeLocked

  ```go
  func (e * endtry) storeLocked(i *interface{}) {
  	atomic.StorePointer(&e.p, unsafe.Pointer(i))
      // 1. 获取 e.p 的地址，即 &e.p。
  	// 2. 将指针 unsafe.Pointer(i) 存储到 &e.p 所指向的地址中。
  }
  ```

* dirtyLocked

  ```go
  func (m *Map) dirtyLocked() {
      if m.dirty != nil { // 如果dirty对象已经存在,不需要再创建,直接返回
          return
      }
  	//根据read重新创建一个对象
      read, _ := m.read.Load().(readOnly)
      m.dirty = make(map[interface{}]*entry, len(read.m)) // 新建一个dirty对象
      // 遍历 read中的key, value, 复制到dirty中
      for k, e := range read.m {
          // 如果标记为nil或者expunged，则不复制到dirty map
          if !e.tryExpungeLocked() {
              m.dirty[k] = e
          }
      }
  }
  ```

* tryExpungedLocked

  ```go
  func (e *entry) tryExpungedLocked() (isExpunged bool) {
      p := atomic.LoadPointer(&e.p)
      for p == nil {
          //将nil的值改为expunged, 这样做是为了表明在对dirty重构前,这个key只存在read,不存在dirty
          if atomic.CompareAndSwapPointer(&e.p, nil, expunged) {
              return true
          }
          p = atomic.LoadPointer(&e.p)
      }
      return p == expunged
  }
  ```

  