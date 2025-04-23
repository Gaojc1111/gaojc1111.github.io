---
title: Go的sync.Pool有什么用?
date: 2025-04-17 19:57:04
tags: 
  - Go
cover: https://hbzhtd.oss-cn-beijing.aliyuncs.com/imags/1.png
---

## 前言

最近笔试遇到一个问题：Go 的 sync.Pool 有什么作用？涉及到我的知识盲区了，遂入门学习了一下，写篇复习笔记以备不时之需。另外笔试的算法没写出来，一是时间不够，而是一段时间没碰算法了，有点手忙脚乱，祈祷笔试能过吧...T_T。

## sync.Pool 是什么

`sync.Pool`是 sync 包下的一个组件，用于将对象进行池化，对内存进行复用。

## sync.Pool 有什么用

在日常的开发中，我们可能需要经常创建某个临时对象，当并发量很高时，频繁的创建和销毁就会对GC造成很大的压力。sync.Pool 通过将对象缓存起来放入“池子”中，用的时候从池子中取，不用的时候返回池子中，避免了频繁的创建和销毁，减少GC压力，提升系统的性能。

## sync.Pool 怎么使用

sync.Pool有三种基本操作：Get、Put、New。

首先需要设置好New函数，当Pool中没有数据时通过New方法创建一个新的。其次是Get方法，当Pool中有对象时，Get就会拿到这个对象，否则调用New创建一个。Put方法用于将使用完的对象放回Pool中，实现复用。

下面是一个例子：

```go
type student struct {
	Name string
}

var studentPool = sync.Pool{
	New: func() interface{} {
		return new(student)
	},
}

func main() {
	stu := studentPool.Get().(*student)
	fmt.Println("第一次Get操作：", stu)

	stu.Name = "zhang3"
	fmt.Println("设置 stu.Name =", stu.Name)

	studentPool.Put(stu) // 放回, 实际使用时，记得进行reset

	stu = studentPool.Get().(*student)
	fmt.Println("放回后Get数据:", stu)

	stu1 := studentPool.Get().(*student)
	fmt.Println("不放回Get数据:", stu1)
}
```

运行结果：
```
第一次Get操作： &{}
设置 stu.Name = zhang3
放回后Get数据: &{zhang3}
不放回Get数据: &{}
```

## sync.Pool 的应用

### fmt 包如何使用

```go
func Printf(format string, a ...interface{}) (n int, err error) {
	return Fprintf(os.Stdout, format, a...)
}
```

```go
func Fprintf(w io.Writer, format string, a ...interface{}) (n int, err error) {
	p := newPrinter()
	p.doPrintf(format, a)
	n, err = w.Write(p.buf)
	p.free()
	return
}
```

```go
// newPrinter allocates a new pp struct or grabs a cached one.
func newPrinter() *pp {
	p := ppFree.Get().(*pp)
	p.panicking = false
	p.erroring = false
	p.wrapErrs = false
	p.fmt.init(&p.buf)
	return p
}

var ppFree = sync.Pool{
	New: func() interface{} { return new(pp) },
}

```

### pool_test 官方测试

```go
func TestPoolNew(t *testing.T) {
	// disable GC so we can control when it happens.
	defer debug.SetGCPercent(debug.SetGCPercent(-1))

	i := 0
	p := Pool{
		New: func() interface{} {
			i++ // 闭包捕获，每次调用New都会+1
			return i
		},
	}
	if v := p.Get(); v != 1 {
		t.Fatalf("got %v; want 1", v)
	}
	if v := p.Get(); v != 2 {
		t.Fatalf("got %v; want 2", v)
	}

	// Make sure that the goroutine doesn't migrate to another P
	// between Put and Get calls.
	Runtime_procPin()
	p.Put(42)
	if v := p.Get(); v != 42 {
		t.Fatalf("got %v; want 42", v)
	}
	Runtime_procUnpin()

	if v := p.Get(); v != 3 {
		t.Fatalf("got %v; want 3", v)
	}
}
```

## 参考

[深度解密 Go 语言之 sync.Pool](https://www.cnblogs.com/qcrao-2018/p/12736031.html)
