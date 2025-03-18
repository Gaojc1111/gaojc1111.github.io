---
title: MySQL笔记
author: Hbzhtd
date: 2023-10-11 20:13:33
categories:
  - MySQL
tags:
  - MySQL
cover: https://hbzhtd.oss-cn-beijing.aliyuncs.com/imags/Link.png
---

# 基本查询



## SELECT：查询

### 查询多个字段

```mysql	
SELECT
    first_name, last_name
FROM
    actor;
```

### 查询所有字段

```mysql
SELECT
    *
FROM
    actor
```

### 没有 FROM 的 SELECT

```mysql
SELECT NOW();
SELECT 1+2;
```

### 虚拟表 dual

```mysql
SELECT NOW() FROM dual;
SELECT 1+2 FROM dual;
```



## WHERE：过滤

```mysql
SELECT
    *
FROM
    actor
WHERE
    last_name = 'DAVIS' AND first_name = 'SUSAN';
```

### AND

有0则0，无0有NULL则NULL。

```mysql
SELECT
    *
FROM
    actor
WHERE
    last_name = 'DAVIS' AND actor_id < 100;
```

### OR

有1则1，无1有NULL则NULL。

### AND优先级高于OR

```mysql
+--------------+
| 1 OR 0 AND 0 |
+--------------+
|            1 |
+--------------+
```

## IN | NOT IN

* 正常返回1或0
* 当左侧为 `NULL`，返回 `NULL`。
* 当右侧列表含有 `NULL`，有返回 `1`，无返回 `NULL`

```mysql
SELECT
    *
FROM
    actor
WHERE
    last_name IN ('ALLEN', 'DAVIS');
```



## BETWEEN AND

```mysql
SELECT
    film_id, title, replacement_cost
FROM
    film
WHERE
    replacement_cost BETWEEN 1 AND 10; [1,10] 
```

### NOT BETWEEN

```mysql
SELECT
    film_id, title, replacement_cost
FROM
    film
WHERE
    replacement_cost NOT BETWEEN 10 AND 50; 
```



## LIKE：模糊查询

> `%` 匹配任意个字符。
>
> `_` 匹配单个字符。
>
> 如果需要匹配通配符，则需要使用 `\` 转义字符，如 `\%` 和 `\_`。

### 使用 `%` 匹配开头

```mysql
SELECT * FROM actor WHERE first_name LIKE 'P%';
```

### 使用 `%` 匹配结尾

```mysql
SELECT * FROM actor WHERE first_name LIKE '%ES';
```

### 使用 `%` 匹配包含字符

```mysql
SELECT * FROM actor WHERE first_name LIKE '%AM%';
```

### 使用 `_` 匹配单个字符

```mysql
SELECT * FROM actor WHERE first_name LIKE '_AY';
```

### NOT LIKE

```mysql
SELECT * FROM category WHERE name NOT LIKE 'A%';
```



## 正则表达式REGEXP

```mysql
SELECT
	*
FROM
	customers
WHERE 
	first_name REGEXP 'a'         	-- 包含a
	first_name REGEXP '^a'        	-- 以a开头
	first_name REGEXP 'a$'    	  	-- 以a结尾
	first_name REGEXP 'a$|^b' 		-- 以a结尾或以b开头
	first_name REGEXP '[abc]'		-- 包含aa, ba, ca
	first_name REGEXP '[a-c]a'		-- 包含aa, ba, ca
```



## 别名

### 列的别名

```mysql
SELECT
    first_name AS fn, 
    last_name `Last Name`, -- AS 关键字可省略, 有空格时需加上``括起来
    CONCAT(first_name, ', ', last_name) `Full Name`
FROM
    actor
```

### 表的别名

```mysql
SELECT *
FROM film f
```



## IS NULL

```mysql
SELECT
    first_name, last_name, password
FROM
    staff
WHERE
    password IS NULL;
```



## EXISTS

- `EXISTS` 操作符用来判断一个子查询是否返回数据行。如果一个子查询返回了至少一个数据行，则 `EXISTS` 的计算结果为 `TRUE`，否则计算结果为 `FALSE`。
- `NOT EXISTS` 则是 `EXISTS` 的否定操作。

```mysql
SELECT *
FROM language
WHERE EXISTS(
    SELECT *
    FROM film
    WHERE film.language_id = language.language_id
  );
  
SELECT *
FROM language
WHERE language_id IN (
    SELECT DISTINCT language_id
    FROM film
  ); -- 使用 EXISTS 的语句的性能比对应的使用 IN 的语句要好。
```



## ORDER BY：排序

- 升序排序时， `NULL` 在非 NULL 值之前；降序排序时，`NULL` 在非 NULL 值之后。

### 按多字段排序

```mysql
SELECT
    actor_id, first_name, last_name
FROM
    actor
ORDER BY last_name DESC, first_name;
```

### 使用 `CASE` 实现自定义排序

```mysql
SELECT
    film_id, title, rating
FROM
    film
ORDER BY CASE rating
    WHEN 'G' THEN 1
    WHEN 'PG' THEN 2
    WHEN 'PG-13' THEN 3
    WHEN 'R' THEN 4
    WHEN 'NC-17' THEN 5
END;

+---------+-----------------------------+--------+
| film_id | title                       | rating |
+---------+-----------------------------+--------+
|       2 | ACE GOLDFINGER              | G      |
|       4 | AFFAIR PREJUDICE            | G      |
...
|       1 | ACADEMY DINOSAUR            | PG     |
|       6 | AGENT TRUMAN                | PG     |
...
|       7 | AIRPLANE SIERRA             | PG-13  |
|       9 | ALABAMA DEVIL               | PG-13  |
...
|       8 | AIRPORT POLLOCK             | R      |
|      17 | ALONE TRIP                  | R      |
...
|       3 | ADAPTATION HOLES            | NC-17  |
|      10 | ALADDIN CALENDAR            | NC-17  |
```

### 使用 `FIELD()` 函数实现自定义排序

```mysql
SELECT
    *
FROM
    film
ORDER BY FIELD(rating, 'G', 'PG', 'PG-13', 'R', 'NC-17');
```



## TABLE

```mysql
TABLE products
SELECT * FROM products -- 等价
```



## LIMIT：分页

- `LIMIT` 子句限定查询返回的行数。
- `LIMIT` 子句经常结合 `ORDER BY` 查询排名列表。

```mysql
SELECT
    film_id, title, length
FROM
    film
WHERE
    rating = 'G'
ORDER BY length
LIMIT 10; -- limit 3, 4 跳过3行, 最多显示4行
```



## DISTINCT：去重

```mysql
SELECT DISTINCT 
	last_name, first_name 
FROM 
	actor;
```



# 多表查询

## 内连接

内连接基于连接条件组合两个表中的数据。

```mysql
SELECT
	order_id, first_name, last_name, orders.customer_id
FROM
	orders
	INNER JOIN customers -- INNER 可省略
	ON	orders.customer_id = customers.customer_id
-- 等价(隐式连接,不推荐,会忘记where)
FROM
	orders, customers 
WHERE 
	orders.customer_id = customers.customer_id
```

> 表的别名：在表后空格写表的别名
>
> ```mysql
> SELECT
> 	order_id, first_name, last_name, o.customer_id
> FROM
> 	orders o
> 	JOIN customers c
> 	ON	o.customer_id = c.customer_id
> ```

### 跨数据库连接

```mysql
SELECT
	*
FROM
	order_items oi
JOIN sql_inventory.products p
	ON	oi.product_id = p.product_id
```

### 自连接

两张一样的表进行连接

```mysql
SELECT
	e.employee_id, e.first_name, m.first_name AS manager
FROM
	employees e
JOIN employees m
	ON	e.reports_to = m.employee_id
```

### 多表连接

通过什么信息拿到什么信息

```mysql
SELECT
    o.order_id, c.first_name, c.last_name, o.order_date, os.`name`
FROM
	orders o
JOIN customers c
	ON	o.customer_id = c.customer_id 		-- 通过顾客id拿到顾客名字
JOIN order_statuses os
	ON	o.`status` = os.order_status_id		-- 通过status id拿到status 名字
ORDER BY order_id
```

## 外连接

- 内连接基于连接条件组合两个表中的数据。
- 外连接基于连接条件，对于不满足条件的用NULL作为数据补充

### 单表外连接

```mysql
SELECT
	p.product_id, p.`name`, oi.quantity
FROM
  	products p
    LEFT JOIN order_items oi
    on p.product_id = oi.product_id -- USING(product_id) 等价
```

### 多表外连接

```mysql
SELECT
	o.order_date, o.order_id, c.first_name, s.`name` AS shipper, os.`name` AS status
FROM
	orders o
	JOIN customers c
	ON o.customer_id = c.customer_id
	LEFT JOIN shippers s
	on o.shipper_id = s.shipper_id
	JOIN order_statuses os
	on o.`status` = os.order_status_id
ORDER BY status
```

## USING：等值匹配

``` mysql
SELECT
  student.*,
  student_score.*
FROM
  student
  JOIN student_score USING(student_id); -- 列名一样
```

## 交叉连接：笛卡尔积

```mysql
SELECT
  student.*,
  student_score.*
FROM
  student 
  CROSS JOIN student_score;
-- 等价
FROM
  student, student_score; -- 等价于无连接条件的内连接
```

## 自然连接

特殊的等值连接

```mysql
SELECT
	o.order_id,
	c.first_name
FROM
	orders o
NATURAL JOIN customers c -- 基于相同列自动连接, 不建议使用
```





## UNION

- `UNION` 运算要求参与运算的两个结果集的列数必须一样。
- `UNION` 运算取第一个参与运算的结果集的列名作为最终的列名。

```mysql
SELECT
	customer_id, first_name, points, 'Bronze' AS type
FROM
	customers
WHERE points <= 2000
UNION
SELECT
	customer_id, first_name, points, 'Silver' AS type
FROM
	customers
WHERE points BETWEEN 2000 AND 3000
UNION
SELECT
	customer_id, first_name, points, 'Gold' AS type
FROM
	customers
WHERE 
	points > 3000
ORDER BY first_name
```

# Create

### 创建表

```mysql
CREATE TABLE user (
    id INT AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    age INT,
    birthday DATE,
    PRIMARY KEY (id)
);
```

### 表复制创建

```mysql
CREATE TABLE invoices_archive
SELECT 
	invoice_id, number, c.`name` client_name, invoice_total, payment_total, invoice_date, due_date, payment_date
FROM
	invoices i
JOIN clients c
USING(client_id)
WHERE 
	payment_date IS NOT NULL;
```



# INSERT

### 插入单行

```mysql
INSERT INTO customers 
VALUES (DEFAULT, 'john', 'Smith', '2002-11-11', NULL, 'a', 'b', 'c', DEFAULT);

-- 没有默认值的列必须指明一个值
-- 按列名顺序指定
INSERT INTO customers(first_name, last_name, birth_date, address, city, state)
VALUES ('aaa', 'bbb', '2003-11-11', 'hunan', 'cs', 'no'); 
```

### 插入多行

```mysql
INSERT INTO shippers(`name`)
VALUES ('aaa'), ('bbb')
```

### INSERT中使用子查询

```mysql
INSERT INTO shippers(`name`)
SELECT 
	`name`
FROM
	shippers
WHERE shipper_id > 10 -- 
```

> 有子查询时，应当先执行子查询查看是否符合预期

# UPDATE

### 更新多行

```mysql
UPDATE invoices_archive
SET invoice_total = 100.0
-- 默认所有行

UPDATE invoices_archive
SET invoice_total = 100.0
WHERE invoice_id = 1 -- 指定行
```

### UPDATE中使用子查询

```mysql
UPDATE orders
SET comments = 'jpgk'
WHERE customer_id IN (
            SELECT customer_id
            FROM	customers
            WHERE points >= 3000
            )
```



# DELETE

- `ORDER BY` 子句用来指定删除行的顺序。它是可选的。它不能用在多表删除。
- `LIMIT` 子句用来指定删除的最大行数。它是可选的。它不能用在多表删除。

### 删除表全部数据

```mysql
DELETE FROM invoices
```

### 删除中使用子查询

```mysql
DELETE FROM invoices
WHERE client_id = (
        SELECT client_id
        FROM clients
        WHERE `name` = 'Myworks'
	)
```



# 聚合函数

```mysql
SELECT 
	MAX(invoice_total) highest,
	MIN(invoice_total) lowest,
	AVG(invoice_total) average,
	SUM(invoice_total * 0.5) total,
	COUNT(DISTINCT client_id) total_records
FROM invoices 
```



# GROUP BY：分组

```mysql
SELECT
	date,
	pm.`name` payment_method,
	SUM(p.amount) total_payments
FROM payments p
	JOIN invoices i
	USING(invoice_id)
	JOIN payment_methods pm
	ON p.payment_method = pm.payment_method_id
GROUP BY date, payment_method -- 指定的分组字段
ORDER BY date
```

# HAVING：对分组进行过滤

只能作用于在select结果集中出现的列

```mysql
SELECT
	client_id,
	SUM(invoice_total) total_sales,
	COUNT(*) number_of_invoices
FROM 
	invoices
GROUP BY client_id
HAVING total_sales >= 500 AND number_of_invoices > 5
```

# 子查询

## where中的子查询

```mysql
SELECT
	*
FROM
	employees
WHERE 
	salary > (
	SELECT AVG(salary)
	FROM employees
	)
```

## IN 子查询

```mysql
SELECT
	*
FROM
	clients
WHERE
	client_id NOT IN (
	SELECT DISTINCT client_id
	FROM invoices
	)
-- 等价
SELECT
	*
FROM 
	clients c
	LEFT JOIN invoices i
	USING(client_id)
WHERE i.client_id IS NULL
```

## ALL 子查询

```mysql
SELECT
	*
FROM
	invoices
WHERE 
	invoice_total > ALL ( -- 大于全部结果
	SELECT invoice_total
	FROM invoices
	WHERE client_id = 3
	)
```

## ANY 子查询

```mysql
SELECT
	*
FROM
	invoices
WHERE 
	invoice_total > ANY ( -- 大于任意一个 等价于IN
	SELECT invoice_total
	FROM invoices
	WHERE client_id = 3
	)
```

## 相关子查询

```mysql
SELECT
	*
FROM
	invoices i
WHERE
	i.invoice_total > (
	SELECT AVG(invoice_total)
	FROM invoices
	WHERE client_id = i.client_id
	)
```

## EXISTS

```mysql
SELECT
	*
FROM
	products p
WHERE NOT EXISTS (
	SELECT *
	FROM order_items oi
	WHERE p.product_id = oi.product_id
)
```

## SELECT子查询

```mysql
SELECT
	client_id, 
	`name`,
	(SELECT SUM(invoice_total) FROM invoices WHERE client_id = c.client_id) total_sales,
	(SELECT AVG(invoice_total) FROM invoices) average,
	(SELECT total_sales - average) difference
FROM
	clients c;
```

## FROM子查询 派生表

* 派生表必须有别名

```mysql
SELECT
	* 
FROM (
	SELECT
		client_id, 
		`name`,
		(SELECT SUM(invoice_total) FROM invoices WHERE client_id = c.client_id) total_sales,
		(SELECT AVG(invoice_total) FROM invoices) average,
		(SELECT total_sales - average) difference
	FROM
		clients c
) psb; -- 必须有别名
```

# 函数

## 数值函数

### ROUND 四舍五入

```mysql
select round(5.4962, 2); -- 保留两位小数四舍五入 5.50
```

## 条件函数

### if

```mysql
select
    if(age >= 25, '25岁及以上', '25岁以下') age_cut, count(*) number
from
    user_profile
group by
    age_cut;
```

### case

```mysql
select
    case
        when age < 25 or age is null then '25岁以下'
        when age >= 25 then '25岁及以上'
        else '...'
    end age_cut,
    count(*) number
from
    user_profile
group by
    age_cut;
```

## 日期函数



# VIEW：视图

## CREATE VIEW 创建

视图类似表的指针，可以当做表使用

```mysql
CREATE VIEW clients_balance AS
SELECT
	c.client_id, c.`name`, i.invoice_total - i.payment_total balance
FROM
	clients c
	JOIN invoices i
	USING (client_id)
GROUP BY client_id
```

## DROP VIEW 删除

```mysql
DROP VIEW clients_balance;
```

## CREATE OR REPLACE VIEW 创建或更改

```mysql
CREATE OR REPLACE VIEW clients_balance AS
SELECT
	c.client_id, c.`name`, i.invoice_total - i.payment_total balance
FROM
	clients c
	JOIN invoices i
	USING (client_id)
GROUP BY client_id;
```

## 可更新视图

## WITH CHECK OPTION

防止update或delete删除视图中的行

```mysql
CREATE OR REPLACE VIEW clients_balance AS
SELECT
	c.client_id, c.`name`, i.invoice_total - i.payment_total balance
FROM
	clients c
	JOIN invoices i
	USING (client_id)
WITH CHECK OPTION; -- 必须是可更新视图
```

# 事务

特性:

1. 原子性
2. 一致性
3. 隔离性
4. 持久性

## 事务操作

### 开启事务

```mysql
start transaction;
```

### 提交事务

```mysql
commit;
```

### 回滚事务

```mysql
rollback;
```

## 事务隔离级别

### 查看事务隔离级别

```mysql
select @@transaction_isolation
```

### 设置事务隔离级别

```mysql
set session transaction isolation level read uncommitted ; 
-- session表示当前会话, global表示全局
```