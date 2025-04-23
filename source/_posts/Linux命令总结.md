---
title: Linux命令
date: 2023-09-24 17:02:40
author: Hbzhtd
categories: 
  - Linux
tags: https://hbzhtd.oss-cn-beijing.aliyuncs.com/imags/2.png
  - Linux
---

# 常用命令

## man

查看命令的帮助文档。

## ls

显示指定目录下的文件列表

```shell
ls [选项] 指定目录
-a 显示隐藏文件
-l 长格式显示详细信息
-t 按照时间排序
-r 逆序排序（默认按文件名排序）
-R 递归显示
```

## cd

切换工作目录

```shell
cd - 切换到上次目录
cd .. 切换到上级目录
cd /x/xx/xxx 切换到指定目录
```

# 文件

通配符：

1. *（匹配任意字符）
2. ？（匹配单个字符）
3. [xyz]（匹配xyz任意一个）
4. [a-z]（匹配范围a~z）
5. [!xyz]（不匹配）

.开头的文件为隐藏文件

## mkdir

创建文件夹

```shell
mkdir directory...
-p 递归创建
```

## rmdir

删除空文件夹

```shell
rmdir directory...
```

## rm

删除文件/文件夹

```shell
rm -r directory...	删除文件夹
-f 强制删除
```

## cp

复制文件夹/文件

```shell
cp src dst 复制文件
cp -r src dst 复制文件夹
-v 显示进度、信息
-p 保留原有时间
-a 保留所有
```

## mv

文件改名/移动

```shell
mv file/directory file/directory
```

# 文本查看

## cat

显示文本内容到终端

```shell
cat file
```

## head

查看文件开头

```shell
head file 显示开头10行
-5 显示5行
```

## tail

查看文件结尾

```shell
tail fiel 显示末尾10行
-3 显示3行
-f 当文件更新， 同步显示最新数据
```

## wc

统计文件内容信息

```shell
wc file 
-l 查看行数
```

## less

## more

# 打包、压缩、解压

## tar

```shell
tar [option]... file...
# 打包
tar -cf  archive.tar     file1 file2
# 压缩
gzip filename
bzip2 filename
# 打包并压缩
tar -czf archive.tar.gz  file1 file2 file3 ... #-z：使用 gzip 进行压缩。
tar -cjf archive.tar.bz2 file1 file2 file3 ... #-j：使用 bzip2 进行压缩。
# 解压
tar -xf  archive.tar 	 -C /root #-C：指定解压路径
tar -xzf archive.tar.gz  -C /root #-z：表示使用 gzip 进行解压缩。
tar -xjf archive.tar.bz2 -C /root #-j：表示使用 bzip2 进行解压缩。
```

# vim

## 普通模式

其他模式按esc返回。

H/J/K/L：光标 左/下/上/右 移动

 复制：

* yy：复制单行
* 3yy：复制3行
* y$：复制光标和光标后的文本

剪切：

* dd：剪切一整行
* d$：剪切光标和光标后

粘贴：p

撤销：u

反撤销/重做：Ctrl+R

其它：

* x：删除光标字符
* r + 字符：替换光标字符
* :set nu：显示行号
* n + G：跳转到n行
* g：跳转到第一行
* G：跳转到最后一行
* ^：跳转到当前行开头
* $：跳转到当前行末尾

## 命令模式

:w：保存

:q：退出

:wq：保存并退出

:q!：不保存退出

/字符：查找字符。n显示下一个，N显示上一个

## 插入模式

命令模式按：

* I/i：当前行最开始/当前光标
* A/a：当前行末尾/当前光标下一个
* O/o：上一行新行/下一行新行

## 可视模式
