---
title: Redis 学习笔记 - 实战篇
description: 黑马程序员 Redis 教程学习笔记
---

> 课程链接：[bilibili](https://www.bilibili.com/video/BV1cr4y1671t?)
> 
> 项目：[黑马点评](https://github.com/yuejiangw/redis-learn/tree/main/hm-dianping)

![](/images/redis/action/intro.png)

项目架构

![](/images/redis/action/architecture.png)

## 共享 Session（单点登录）

> P24 - P34

如果不使用 Redis，常规流程如下：

(1) 基于 Session 实现短信登录

![](/images/redis/action/login/session-login-workflow.png)

(2) 基于登录校验拦截器进行验证

![](/images/redis/action/login/interceptor.png)

**问题**

Session 共享问题：多台 Tomcat 并不共享 session 存储空间，当请求切换到不同的 tomcat 服务器时候导致数据丢失

![](/images/redis/action/login/session-share-issue.png)

虽然 Tomcat 支持 session 拷贝，但存在延迟，因此并未广泛使用。Session 的替代方案应满足：

- 数据共享
- 内存存储
- key - value 结构

因此 Redis 就是该问题的解决方案

(3) 基于 Redis 实现共享 session 登录

**key 如何设计**
为了安全性，随机生成 token，而不是拼接用户信息，防止恶意伪造或爆破

**选用何种 value 数据结构存放用户信息**

string 还是 hash？有两种方案：

- 先在程序中将对象进行 JSON 序列化，再以 string 类型写入
- 直接以 hash 数据结构写入

因为用户信息是对象，我们这里选择 hash 类型作为 value 的类型，占用的内存更少、且支持对单个字段的增删改查。具体流程如下：

![](/images/redis/action/login/redis-login-workflow.png)

Redis 代替 session 需要考虑的问题：

- 选择合适的数据结构
- 选择合适的 key
- 选择合适的存储粒度

**登录拦截器优化**

之前我们的拦截器只会拦截需要访问用户信息的 URL，如果用户一直在操作无需访问个人信息的 URL 如主页，则拦截器就不会刷新 Redis，从而导致登录失效。解决办法是在登录拦截器前再加一个拦截器，用来拦截一切路径，其作用是负责刷新 token 有效期。

![](/images/redis/action/login/interceptor-optimization.png)

## 缓存

> P35 - P47

**什么是缓存？**

![](/images/redis/action/cache/cache.png)

缓存作用

- 降低后端负载
- 提高读写效率，降低相应时间

缓存成本

- 数据一致性成本
- 代码维护成本
- 运维成本

### 实现

流程

![](/images/redis/action/cache/cache-workflow.png)

缓存更新策略

![](/images/redis/action/cache/cache-update.png)

业务场景

- 低一致性需求：使用内存淘汰机制，例如店铺类型的查询缓存
- 高一致性需求：主动更新，并以超时剔除作为兜底方案，例如店铺详情查询的缓存

**主动更新策略**

Cache Aside 是最常用的方式

- Cache Aside Pattern：由缓存的调用者，在更新数据库的同时更新缓存
- Read / Write Through Pattern：缓存与数据库整合为一个服务，由服务来维护一致性。调用者调用该服务，无需关心缓存一致性问题
- Write Behind Caching Pattern：调用者只操作缓存，由其他线程异步地将缓存数据持久化到数据库，保证最终一致

操作缓存和数据库时有三个问题需要考虑：

1. 删除缓存还是更新缓存
   - 更新缓存：每次更新数据库都更新缓存，无效写操作较多 ❌
   - 删除缓存：更新数据库时让缓存失效，查询时再更新缓存 ✅
2. 如何保证缓存与数据库的操作同时成功 / 失败？
   - 单体系统，将缓存与数据库操作放在一个事务
   - 分布式系统，利用 TCC 等分布式事务
3. 先操作缓存还是先操作数据库？
   - 先删除缓存，再操作数据库
   - 先操作数据库，再删除缓存

关于缓存和数据库的操作顺序，可能存在如下问题：

![](/images/redis/action/cache/cache-aside-problem.png)

上面两种方案中，最终我们选择右边的方案，也就是先操作数据库再删除缓存。因为如果出现图中的问题，线程 2 需要在线程 1 更新数据库的这一段很短的时间内就完成数据库的写操作，这种事情发生的可能性很低，因为写缓存是在内存中，一般速度很快。

为了避免图中的问题真的发生，我们在写缓存的时候可以加上一个超时时间

### 缓存可能遇到的问题

#### 缓存穿透 - Cache Penetration

客户端请求的数据在缓存中和数据库中都不存在，这样缓存永远不会生效，这些请求都会打到数据库，增大数据库的压力。

解决方案：

- 缓存空值：缓存一个空值并设置 TTL
  - 优点：实现简单，维护方便
  - 缺点：额外的内存消耗、可能造成短期的不一致
- 布隆过滤：在客户端和 Redis 中间加一个布隆过滤器，每次查询前会询问过滤器数据是否存在，如果不存在会直接拒绝请求，阻止继续向下查询
  - 优点：内存占用少，没有多余的 key
  - 缺点：实现复杂、存在误判可能

![](/images/redis/action/cache/cache-penetration.png)

预防做法：

- 缓存 `null` 值
- 布隆过滤
- 增强对请求数据的校验，比如 `id > 0`
- 增强对数据格式的控制，比如 `id` 设置为 10 位，不为 10 位的直接拒绝
- 增强用户权限校验
- 通过限流来保护数据库

#### 缓存雪崩 - Cache Avalanche

大量 `key` 同时失效或者 Redis 宕机导致大量请求访问数据库，带来巨大压力

解决思路：

- 给不同的 key 的 TTL 添加随机值，不让 key 同时失效
- 尽量不让 Redis 宕机（高可用集群）
- 给缓存业务添加降级限流的策略
- 给业务添加多级缓存

![](/images/redis/action/cache/cache-avalanche.png)

#### 缓存击穿 - Hotspot Invalid

也叫热点 key 失效问题，一个被高并发访问并且缓存重建业务较复杂的 key 突然失效了，无数的请求会在瞬间给数据库带来巨大冲击

一般发生在某个商品做活动的场景下

![](/images/redis/action/cache/hotspot-invalid.png)

两种解决方案：

- 互斥锁
  - 只有一个线程会负责缓存重建，其他拿不到锁的线程必须等待
  - 问题：性能比较差，同一时间只有一个线程可以进行缓存重建
  - 借助 `setnx` 命令获取锁，成功返回 1，失败返回 0
  - 借助 `del` 命令释放锁
- 逻辑过期
  - 在插入 Redis 的时候不设置 TTL，而是设置一个 expire 字段代表预计的过期时间（比如，可以设置为活动结束之后的 timestamp）
  - 在查询 Redis 的时候由程序进行逻辑判断。如果发现缓存失效，则新开一个线程，获取互斥锁，进行缓存重建，同时返回过期结果
  - 由于使用了互斥锁，因此同一时间只会有一个线程负责缓存重建，直接返回过期结果确保不会由线程阻塞引起性能低下

加锁 / 释放锁代码片段

```java
private boolean tryLock(String key) {
    Boolean flag = stringRedisTemplate.opsForValue().setIfAbsent(key, "1", 10, TimeUnit.SECONDS);
    return BooleanUtil.isTrue(flag);
}

private void unlock(String key) {
    stringRedisTemplate.delete(key);
}
```


![](/images/redis/action/cache/hotspot-invalid-solution.png)

两种方式都使用了互斥锁来降低缓存重建的开销，方案优缺点对比如下：

![](/images/redis/action/cache/solution-compare.png)

可以将上述两种方式封装成一个缓存工具类：

![](/images/redis/action/cache/cache-tool.png)

## 优惠券秒杀

### 全局 ID 自增

每个店铺都可以发布优惠券，订单表如果使用数据库自增 ID 就会存在一些问题：

- id 的规律性太明显，容易暴露信息
- 受表单数据量的限制可能需要分表，无法保证全局唯一 ID

全局 ID 生成器，是一种在分布式系统下用来生成全局唯一 ID 的工具，一般要满足下列特性：

- 唯一性
- 高可用
- 高性能
- 递增性
- 安全性

常见的全局唯一 ID 生成策略

- UUID
- Redis 自增
- snowflake 算法（雪花算法，Twitter 发明的，依赖于时钟）
- 数据库自增

Redis 自增 ID 策略

- 时间戳 + 计数器（为了增加 ID 的安全性，我们可以不直接使用 Redis 自增的数值，而是拼接一些其他信息）
- 每天一个 key，方便统计订单量

![](/images/redis/action/voucher/unique-id.png)

代码

```java
public long nextId(String keyPrefix) {
    // 1. 生成时间戳
    LocalDateTime now = LocalDateTime.now();
    long nowSecond = now.toEpochSecond(ZoneOffset.UTC);
    long timestamp = nowSecond - BEGIN_TIMESTAMP;

    // 2. 生成序列号，由于序列号只有32位，因此不能所有业务都用同一个 key，要加上日期进行区分，也便于后续统计
    // 2.1 获取当前日期，精确到天
    String date = now.format(DateTimeFormatter.ofPattern("yyyy:MM:dd"));
    // 2.2 自增长
    long count = stringRedisTemplate.opsForValue().increment("icr:" + keyPrefix + ":" + date);

    // 3. 拼接并返回，借助位运算
    return timestamp << COUNT_BITS | count ;
}
```

### 实现优惠券秒杀下单

下单时需要判断两点

- 秒杀是否开始或结束，如果尚未开始或者已经结束则无法下单
- 库存是否充足，不足则无法下单

![](/images/redis/action/voucher/workflow.png)

### 超卖问题

在高并发场景下，我们无法控制线程的执行顺序，从而会导致并发安全问题。

![](/images/redis/action/voucher/over-sell.png)

超卖问题就是典型的多线程安全问题，针对这一问题常见的解决方案是加锁

- 悲观锁 ❌
  - 认为线程安全问题一定会发生，因此在操作数据之前先获取锁，确保线程串行执行
  - 例如：synchronized, lock 都属于悲观锁
  - 优点：简单粗暴
  - 缺点：效率低，不适用于高并发场景
- 乐观锁 ✅
  - 认为线程安全问题不一定会发生，因此不加锁，只是在更新数据时去判断有没有其他线程对数据做了修改
  - 如果没有修改则认为是安全的，自己才更新数据
  - 如果已经被其他线程修改说明发生了安全问题，此时可以重试或异常
  - 优点：性能好
  - 缺点：成功率低，即使没有超卖也会发生扣减失败的情况

乐观锁的关键是判断之前查询得到的数据是否有被修改过，常见的方式有两种

**版本号法**

- 表中新增一列，为版本号，用来标识数据是否变化
- 在查数据的同时查询版本号
- 在扣减的之前判断当前版本号是否等于上一步中查询出来的版本号 
  - 如果相等，说明没有其他线程影响，扣减库存并将版本号加1 
  - 如果不相等，说明有其他线程早于自己对数据库进行了修改，需要丢弃后续操作

![](/images/redis/action/voucher/version-number.png)

**CAS 法**

- Compare and Set
- 在上一个方法中，版本号只有在发生扣减库存的时候才会更新，那么我们可以在执行扣减操作之前直接判断当前库存是否等于我最初拿到的库存，从而得知是否有其他线程已经进行了更新

![](/images/redis/action/voucher/cas.png)

**CAS 法优化**

原有的思路用代码描述如下

```java
boolean success = seckillVoucherService.update()
        .setSql("stock = stock - 1")
        .eq("voucher_id", voucherId)
        .eq("stock", voucher.getStock())    // CAS 乐观锁判断
        .update();
```

这样做有一个问题，即，就算我们没有超卖，也会因为高并发条件下由于获取 stock 数目不一致而导致报错，从而使成功率大大降低。优化后的方案为：

```java
boolean success = seckillVoucherService.update()
        .setSql("stock = stock - 1")
        .eq("voucher_id", voucherId)
        .gt("stock", 0)    // CAS 乐观锁判断
        .update();
```

从判断库存是否相等，改为只限制库存大于 0 即可

### 一人一单

需要修改业务逻辑，要求同一个优惠券，一个用户只能下一单

除了在下单之前进行逻辑判断，还要加锁，否则还是会由于高并发而导致超卖

- 单机情况下，可以通过 `synchronized` 关键字来加锁
- 集群情况下不行，锁的原理是在 JVM 内部维护了一个锁监视器，而集群环境下各个节点有自己独立的 JVM，所以在每个 JVM 的内部都会有一个线程是成功的
  - 需要想办法实现跨 JVM（进程）的锁，也就是分布式锁

![](/images/redis/action/voucher/problem.png)

### 分布式锁

满足分布式系统或集群模式下多进程可见且互斥的锁

![](/images/redis/action/voucher/lock.png)

基本特性

- 多进程可见
- 互斥
- 高可用
- 高性能
- 安全性

#### 基于 Redis 的分布式锁

获取锁

- 添加锁，利用 setnx 的互斥特性 
- 添加锁过期时间，避免服务宕机引起的死锁
- 上述两个步骤合在一起做保证原子性

```
SET lock thread1 EX 10 NX
```

释放锁

- 释放锁，删除即可

```
DEL key
```

![](/images/redis/action/voucher/lock-acquire.png)