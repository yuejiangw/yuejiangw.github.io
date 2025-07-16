---
title: Redis 学习笔记 
---

> 课程链接：[blibili](https://www.bilibili.com/video/BV1cr4y1671t?)

## 基础篇

### Redis 介绍

- 基于内存的 K / V 存储中间件
- NoSQL 键值对数据库

Redis 不仅仅是数据库，它还能作为消息队列等

#### SQL 和 NoSQL 数据库对比

注意使用场景的差异

![](/images/redis/basic/SQL%20vs%20NoSQL.png)

#### Redis 特征

1. 支持多种数据结构
2. 单线程，每个命令的执行具备原子性，中途不会执行其他命令（指命令的处理始终是单线程的，自 6.x 起改为多线程接受网络请求）
3. 高性能，低延时（基于内存，IO 多路复用，良好编码）
4. 支持数据持久化
5. 支持主从、分片集群
6. 支持多语言客户端
7. 默认 16 个数据库，不能配置名字，只能配置数量

### Redis 安装

基于 Mac Homebrew 安装的命令为：

```shell
brew install redis
```

核心配置

配置文件的位置在 `/opt/homebrew/etc/redis.conf`

```shell
# 允许任意 IP 访问
bind 0.0.0.0

# 后台启动 Redis 服务
daemonize yes

# 密码设置
requirepass xxx
```

启动 Redis 服务

```shell
# 借助 Homebrew 启动 Redis 服务
brew services start redis

redis-server
```

查看 Redis 有没有成功启动

```shell
ps -ef | grep redis
```

关闭 Redis 服务

```shell
brew services stop redis
```

### 客户端连接 Redis

通过命令行

```shell
# 1. 进入交互页面
redis-cli

# 2. 输入密码
auth <password>

# 3. 验证是否连接，如果成功连接会返回 PONG
ping
```

### 常用命令

命令集网站：http://www.redis.cn/commands.html

通用命令

- set key value
- get key
- keys pattern 模糊搜索多个 key，性能差（尤其主节点），生产环境不建议用
- del key
- exists key 判断 key 是否存在
- expire key 设置过期时间，到期时候 ttl key 会返回 -2，同时该 key 会被删除
- ttl key 查询剩余存活时间，未设置过期时间则为 -1 代表永久有效

### Redis 基本数据结构

![](/images/redis/basic/type.png)

#### String 类型

支持存储字符串、数字、浮点数（实际存储都是字节数组）

![](/images/redis/basic/string%20format.png)

单 key 的 value 最大不能超过 512 MB

![](/images/redis/basic/common_command.png)

实际使用时，通常用冒号连接多个词来拼接 key，比如 `[项目名]:[业务名]:[类型]:id`，在某些 GUI 工具中，会自动根据冒号来划分层级，浏览更方便。这个格式也并非固定，可以根据自己的需求来删除或添加词条。

如果 Value 是一个 Java 对象，例如一个 User 对象，则可以将对象序列化为 JSON 字符串后存储。

#### Hash 类型

其 Value 是一个无序字典，类似于 Java 中的 HashMap 结构

![](/images/redis/basic/Hash-type.png)

常用命令

> 其实就是在 String 命令名的基础上增加了 H 首字母

![](/images/redis/basic/Hash-type-command.png)

#### List 类型

理解为 Java 的 LinkedList 双向链表，特点是有序、元素可以重复、插入删除快、查找性能一般

常用命令

> 有点像操作一个双端队列

![](/images/redis/basic/List-type-command.png)

#### Set 类型

与 Java 中的 HashSet 类似，可以看做是一个 value 为 null 的 HashMap，因为也是一个哈希表，因此具备与 HashSet 类似的特征：

- 无序
- 元素不可重复
- 查找快
- 支持交集、并集、差集等功能

常用命令

![](/images/redis/basic/Set-type-command.png)

#### SortedSet 类型

可排序集合，与 Java 中的 TreeSet 有些相似，但底层数据结构差别很大。SortedSet 中的每一个元素都带有一个 score 属性，可以基于 score 属性对元素排序，底层的实现是一个跳表（SkipList）加哈希表。SortedSet 具有如下特性：

- 可排序
- 元素不重复
- 查询速度快

常用命令

![](/images/redis/basic/SortedSet-type-command.png)

### Redis 客户端

#### 客户端对比

可以在该网站查看所有客户端：https://redis.io/docs/connect/clients/

对于 Java，推荐 `Jedis`，`Lettuce`，`Redisson` 三种客户端

![](/images/redis/basic/java-client-compare.png)

Spring Data Redis 同时兼容 Jedis 和 Lettuce

#### Jedis 快速入门

[代码](https://github.com/226wyj/redis-learn/tree/main/jedis-demo)

基本使用步骤

1. 引入依赖
2. 创建 Jedis 对象，建立连接
3. 使用 Jedis，方法名与 Redis 命令一致
4. 释放资源

#### SpringDataRedis

[代码](https://github.com/226wyj/redis-learn/tree/main/springdata-redis-demo)

![](/images/redis/basic/spring-data-redis-intro.png)

Spring Data 整合封装了一系列数据访问的操作，Spring Data Redis 则是封装了对 Jedis、Lettuce 这两个 Redis 客户端的操作，提供了统一的 RedisTemplate 来操作 Redis。

RedisTemplate 针对不同的 Redis 数据结构提供了不同的 API，划分更明确

![](/images/redis/basic/redisTemplate.png)

使用步骤

1. 引入 spring-boot-starter-data-redis 依赖
2. 在 application.yaml 配置 Redis 信息
3. 注入 RedisTemplate

**RedisTemplate 序列化**

RedisTemplate 默认使用 JDK 原生序列化器，可读性差、内存占用大，因此可以用以下两种方式来改变序列化机制：

1. 自定义 RedisTemplate，指定 key 和 value 的序列化器
2. (推荐) 使用自带的 StringRedisTemplate, key 和 value 都默认使用 String 序列化器，仅支持写入 String 类型的 key 和 value，因此需要自己将对象序列化成 String 来写入 Redis，从 Redis 读取数据时也要手动反序列化

## 实战篇

> 项目：[黑马点评](https://github.com/yuejiangw/redis-learn/tree/main/hm-dianping)

![](/images/redis/action/intro.png)

项目架构

![](/images/redis/action/architecture.png)

### 共享 Session（单点登录）

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

### 缓存

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

#### 实现

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

### 优惠券秒杀及可能问题

#### 全局 ID 自增

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

#### 实现优惠券秒杀下单

下单时需要判断两点

- 秒杀是否开始或结束，如果尚未开始或者已经结束则无法下单
- 库存是否充足，不足则无法下单

![](/images/redis/action/voucher/workflow.png)

#### 超卖问题

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

#### 一人一单

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

代码示例

```java
public boolean tryLock(long timeoutSec) {
    // 获取当前线程标识
    long threadId = Thread.currentThread().getId();
    // 获取锁
    Boolean success = stringRedisTemplate.opsForValue().setIfAbsent(KEY_PREFIX + name, String.valueOf(threadId), timeoutSec, TimeUnit.SECONDS);
    // 自动拆箱的时候判断空指针
    return Boolean.TRUE.equals(success);
}

public void unlock() {
    stringRedisTemplate.delete(KEY_PREFIX + name);
}
```

缺点

- 极端情况下，线程 1 拿到锁之后有可能阻塞的时间过长超过了 timeout，从而导致锁被自动释放了
- 这时线程 2 可以拿到锁并开始执行自己业务，一段时间后线程 1 的业务执行完毕，执行释放锁的操作
- 由于在释放锁的过程中不加任何判断，因此线程 1 会释放掉线程 2 的锁
- 这样一来，其他线程就可以拿到锁了，从而产生了线程安全问题。

解决办法

- 获取锁的时候要加入线程标识
- 在释放锁的时候对线程 id 加以判断，确保释放的是自己申请的锁
    - 还要保证判断和锁释放这两个过程是原子性的，否则有可能在判断结束释放锁之前的时间节点发生阻塞，而导致释放了其他线程的锁
    - 实现：Lua 脚本（在一个脚本中编写多条 Redis 命令，确保多条命令执行时的原子性）

#### Lua 脚本

调用脚本的常见命令

```shell
EVAL "return redis.call('set', 'name', 'jack)" 0
```

如果脚本中的 key, value 不想写死，可以作为参数传递。key 类型参数会放入 KEYS 数组，其他参数会放入 ARGV 数组，在脚本中可以从 KEYS 和 ARGV 数组获取这些参数

```shell
EVAL return "redis.call('set', KEYS[1], ARGV[1])" 1 name Rose

# Lua 中数组下标是从 1 开始的
# 'set' 是脚本内容
# 1 代表脚本需要的 key 类型的参数个数
```

再次回顾释放锁的业务流程

1. 获取锁中的线程标识
2. 判断是否与指定的标识一致
3. 如果一致则释放锁
4. 如果不一致则什么都不做

最终脚本如下

```redis
-- 获取锁中的线程标识 get key, 比较线程标识与锁中的标识是否一致
if redis.call('get', KEYS[1]) == ARGV[1]) then
  -- 释放锁 del key
  return redis.call('del', KEYS[1])
end
return 0
```

通过 Java 来调用 lua 脚本要借助 `execute` 方法

```java
private static final DefaultRedisScript<Long> UNLOCK_SCRIPT;

static {
    UNLOCK_SCRIPT = new DefaultRedisScript<>();
    UNLOCK_SCRIPT.setLocation(new ClassPathResource("unlock.lua"));
    UNLOCK_SCRIPT.setResultType(Long.class);
}

@Override
public void unlock() {
    // 调用 lua 脚本
    stringRedisTemplate.execute(UNLOCK_SCRIPT, Collections.singletonList(KEY_PREFIX + name), ID_PREFIX + Thread.currentThread().getId());
}
```

### 基于 Redis 的分布式锁的优化

#### 目前问题

**首先来回顾一下基于 Redis 实现分布式锁的基本思路**

- 利用 `set nx ex` 获取锁，并设计过期时间，保存线程标识
- 释放锁时先判断线程标识是否与自己一致，一致则删除锁

特性

- 利用 `set nx` 满足互斥行
- 利用 `set ex` 保证故障时锁依然能够释放，避免死锁，提高安全性
- 利用 Redis 集群保证高可用和高并发特性

**基于 `setnx` 的分布式锁存在以下问题**

1. 不可重入：同一个线程无法多次获取同一把锁
2. 不可重试：获取锁只尝试一次就返回 false，没有重试机制
3. 超时释放：锁超时释放虽然可以避免死锁，但如果业务执行耗时较长，也会导致锁释放，存在安全隐患
4. 主从一致性：如果 Redis 提供了主从集群，且主从同步存在延迟。极端情况下，一个线程在主节点上获取了锁之后主节点发生了宕机，但此时从节点还未同步主节点上的锁信息，从而可能导致其他线程也可以获取到锁

#### Redisson 简介

Redisson 是一个在 Redis 基础上实现的 Java 驻内存数据网格（in-memory data grid），它不仅提供了一系列的分布式的 Java 常用对象，还提供了许多分布式服务，其中就包含了各种分布式锁的实现

添加依赖

```java
<dependency>
    <groupId>org.redisson</groupId>
    <artifactId>redisson</artifactId>
    <version>3.13.6</version>
</dependency>
```

配置（这里建议单独配置 RedissonClient 而不是使用 SpringBoot Starter，因为后者会覆盖已有的 Redis Starter，而我们只想用 Redisson 中的分布式锁）

```java
@Configuration
public class RedissonConfig {
    @Bean
    public RedissonClient redissonClient() {
        // 配置
        Config config = new Config();
        config.useSingleServer().setAddress("127.0.0.1:6379").setPassword("123456");
        // 创建 client 对象
        return Redisson.create(config);
    }
}
```

使用

```java
public class Test {
  @Resource
  private RedissonClient redissonClient;

  @Test
  void testRedisson() throws InterruptedException {
    // 获取锁（可重入），指定锁的名称
    RLock lock = redissonClient.getLock("anyLock");
    // 尝试获取锁, 参数分别是：获取锁的最大等待时间（期间会重试），锁自动释放时间，时间单位
    boolean isLock = lock.tryLock(1, 10, TimeUnit.SECONDS);
    // 判断锁释放获取成功
    if (isLock) {
      try {
        System.out.println("执行业务");
      } finally {
        lock.unlock();
      }
    }
  }    
}
```

### Redisson 锁原理

#### 可重入原理 - p66

在获取锁的时候加一步判断，查看是不是当前线程正在占有锁，其核心是利用 Redis 中的 hash 结构来存储线程标识和重入次数

- 同一线程内的方法获取锁时，重入次数 + 1
- 同一线程内的方法释放锁时，重入次数 - 1
- 当线程内所有方法都执行完毕之后，重入次数一定是 0，此时可以在 Redis 中释放锁

![](/images/redis/action/voucher/reentrant-lock.png)

获取锁的 lua 脚本

```lua
local key = KEYS[1];
local threadId = ARGV[1];
local releaseTime = ARGV[2];

-- 判断锁是否存在
if (redis.call('exisits', key) == 0) then
  redis.call('hset', key, threadId, '1');
  redis.call('expire', key, releaseTime);
  return 1;
end;

-- 锁已经存在，判断 threadId 是否是自己
if (redis.call('hexists', key, threadId) == 1) then
  -- 不存在，获取锁，重入次数 +1
  redis.call('hincrby', key, threadId, '1');
  -- 设置有效期
  redis.call('expire', key, releaseTime);
end;

-- 获取锁的不是自己，获取锁失败
return 0;
```

释放锁的 lua 脚本

```lua
local key = KEYS[1];
local threadId = ARGV[1];
local releaseTime = ARGV[2];

-- 判断当前锁是否是被自己持有
if (redis.call('hexisits', key, threadId) == 0) then
  -- 不是自己，直接返回
  return nil;
end;

-- 是自己的锁，则重入次数 -1
local count = redis.call('hincrby', key, threadId, -1);
-- 判断重入次数是否已经为 0
if (count > 0) then
  -- 大于 0 则不能释放锁，重置有效期然后返回
  redis.call('expire', key, releaseTime);
  return nil
else
  -- 等于 0 说明可以释放锁
  redis.call('del', key);
  return nil;
end;
```

#### 总结 - p67

- 可重入：利用 hash 结构记录线程 id 和重入次数
- 可重试：利用信号量和 PubSub 功能实现等待、唤醒、获取锁失败的重试机制
- 超时续约：利用 watchDog，每隔一段时间（releaseTime / 3），重置超时时间

![](/images/redis/action/voucher/redisson.png)

### Redisson 分布式锁主从一致性问题

没有主从概念，把所有 Redis 节点都看做独立节点，都可以进行读写。获取锁的时候必须向多个 Redis 节点获取锁，只有每一个节点都拿到锁才视为获取锁成功。这种方案在 Redisson 中称为 multilock（联锁）

```java
void setUp() {
    RLock lock1 = redissonClient.getLock("order");
    RLock lock2 = redissonClient.getLock("order");
    RLock lock3 = redissonClient.getLock("order");
    
    // 创建联锁 multilock，它的使用方式和单独的 lock 没有区别
    lock = redissonClient.getMultiLock(lock1, lock2, lock3);
}
```

### 异步秒杀

> p69 - p77

首先来回顾先前的秒杀流程

![](/images/redis/action/voucher/original-seckill.png)

可以发现，在查询优惠券、查询订单、减库存、创建订单这四步中都要访问数据库，而数据库本身的并发能力比较差，因此现有的秒杀流程性能是不高的

**优化思路**

判断秒杀库存和校验一人一单这两部分耗时是较短的，可以分离出来由一个线程独立完成，另外的四个步骤交给另外一个线程来做（同步下单变为异步下单）

- 订单信息可以存储在 Redis 中，利用 Redis 完成库存余量和一人一单的判断，完成抢单业务
- 再将下单业务放入阻塞队列（保存优惠券 id，用户 id，和订单 id），利用独立线程异步读取阻塞队列中的信息，完成下单处理
- 关于 Redis 数据结构，库存信息通过 int 类型存储，一人一单校验通过 set 类型存储

![](/images/redis/action/voucher/updated-seckill.png)

**优化后的流程**

![](/images/redis/action/voucher/updated-workflow.png)

基于阻塞队列的异步秒杀存在的问题

- 内存限制问题：阻塞队列存在于内存中，可存放的数据量受 JVM 内存的限制
- 数据安全问题：服务突然宕机了，内存中的所有信息都会丢失

#### Redis 消息队列实现异步秒杀

> p72 - p77

消息队列（Message Queue），字面意思是存放消息的队列。最简单的消息队列模型包括 3 个角色：

- 消息队列：存储和管理消息，也称为消息代理（Message Broker）
- 生产者：发送消息到消息队列
- 消费者：从消息队列获取消息并处理消息

Redis 提供了三种不同的方式来实现消息队列：

- list 结构：基于 List 结构模拟消息队列
- PubSub：基本的点对点消息模型
- Stream：比较完善的消息队列模型

#### 基于 List 结构模拟消息队列

消息队列，字面意思就是存放消息的队列。而 Redis 的 list 数据结构是一个双向链表，很容易模拟出队列的效果

队列是入口和出口不在一边，因此我们可以利用：`LPUSH` 结合 `RPOP`，或者 `RPUSH` 结合 `LPOP` 来实现

当队列中没有消息可以 consume 的时候，要用 `BLPOP` 或 `BRPOP` 来实现阻塞等待

优点

- 利用 Redis 存储，不受限于 JVM 内存上限
- 基于 Redis 持久化机制，数据安全性有保证
- 可以满足消息有序性

缺点

- 无法避免消息丢失
- 只支持单消费者

#### 基于 PubSub 的消息队列

PubSub 是 Redis 2.0 版本引入的消息传递模型。顾名思义，消费者可以订阅一个或多个 channel，生产者向对应 channel 发送消息后，所有订阅者都能收到相关消息

- SUBSCRIBE channel [channel]：订阅一个或多个频道
- PUBLISH channel msg: 向一个频道发送消息
- PSUBSCRIBE pattern [pattern]：订阅与 pattern 相匹配的所有 channel

优点

- 采用发布订阅模型，支持多生产、多消费

缺点

- 不支持数据持久化
- 无法避免消息丢失
- 消息堆积有上限，超出时数据丢失

#### 基于 Stream 的消息队列

Stream 是 Redis 5.0 引入的一种新数据类型，可以实现一个功能非常完善的消息队列。

STREAM 类型消息队列的 XREAD 命令特点：

- 消息可回溯，读取之后消息不会被删除，会一直存在
- 一个消息可以被多个消费者读取
- 可以阻塞读取
- 当我们指定起始 ID 为 `$` 时，代表读取最新消息，如果我们处理一条消息的过程中，又有超过 1 条以上的消息到达队列，则消磁获取时也只能获取到最新的一条，会出现漏读的问题

#### 基于 Stream 的消息队列 - 消费者组

消费者组（Consumer Group）将多个消费者划分到一个组中，监听同一个队列，具备以下特点：

- 消息可回溯
- 可以阻塞读取
- 消息分流：队列中的消息会分流给组内的不同消费者，而不是重复消费，从而加快消息处理的速度（多消费者争抢消息）
- 消息标识：消费者组会维护一个标识，记录最后一个被处理的消息，哪怕消费者宕机重启，还会从标识之后读取消息，确保每一个消息都会被消费
- 消息确认：消费者获取消息后，消息处于 pending 状态，并存入一个 pending-list。当处理完成后需要通过 XACK 来确认消息，标记消息为已处理，才会从 pending-list 移除

创建消费者组的命令：

```shell
XGROUP CREATE key groupName ID [MKSTREAM]
```

- key: 队列名称
- groupName: 消费者组名称
- ID: 起始 ID 标识，$ 代表队列中最后一个消息，0 则代表队列中第一个消息
- MKSTREAM: 队列不存在时自动创建队列

其他常见命令

```shell
# 删除指定的消费者组
XGROUP DESTROY key groupName

# 给指定的消费者组添加消费者
XGROUP CREATECONSUMER key groupname consumername

# 删除消费者组中的指定消费者
XGROUP DELCONSUMER key groupname consumername
```

从消费者组读取消息

![](/images/redis/action/voucher/read-consumer-group.png)

Redis 消息队列三种模式对比

![](/images/redis/action/voucher/compare.png)

### 达人探店

> p78 - P81

#### 发布探店笔记

类似点评网站的评价，往往是图文结合，对应的表有两个

- tb_blog：探店笔记表，包含笔记中的标题、文字、图片等
- tb_blog_comments: 其他用户对探店笔记的评价

![](/images/redis/action/explore/table-creation.png)

#### 点赞

需求

- 同一个用户只能点赞一次，再次点击则取消点赞
- 如果当前用户已经点赞，则点赞按钮高亮显示（前端实现，判断字段 Blog 类的 isLike 属性）

实现步骤

1. 给 Blog 类中添加一个 isLike 字段，标识是否被当前用户点赞
2. 修改点赞功能，利用 Redis 的 set 集合判断是否点赞过，未点赞过则点赞数 +1，已点赞过则点赞数 -1
3. 修改根据 id 查询 blog 的业务，判断当前登录是否点赞过，赋值给 isLike 字段
4. 修改分页查询 blog 业务，判断当前登录用户是否点赞过，赋值给 isLike 字段

#### 点赞排行榜

基于 Redis 的 SortedSet 实现 (ZSET)

Redis 的 SortedSet 是一个有序的集合，元素是唯一的，但可以有相同的分数（score），因此可以用来实现点赞排行榜

判断当前用户是否已经点赞

```shell
ZADD key score member
```

取消点赞

```shell
ZREM key member
```

查询 top 5 点赞用户

```shell
ZREVRANGE key 0 4
```

#### 好友关注 + 共同关注

> P82 - P83

好友关注实现需要借助 Redis 的 Set 数据类型，共同关注则可以利用 Redis 的集合操作来实现，具体思路如下：

1. 每个用户的关注列表可以用 Redis 的 Set 来存储，集合中的元素是用户 ID。
2. 共同关注的用户可以通过集合的交集操作来获取，Redis 提供了 `SINTER` 命令来实现。

```shell
# 关注某个用户, 假设用户 1 关注用户 2
SADD follows:user:1 user:2

# 取消关注某个用户
SREM follows:user:1 user:2

# 获取共同关注的用户
SINTER follows:user:1 follows:user:2
``` 

#### 关注推送（Feed流）

> P84 - P85

关注推送也叫 Feed 流，是指用户关注其他用户后，能够及时获取到被关注用户的最新动态。可以利用 Redis 的 List 数据结构来实现。

Feed 流产品有两种常见模式：

* Timeline 模式
  * 不做内容筛选，简单的按照内容发布时间排序，常用于好友或关注列表
  * 优点：实现简单，信息全面
  * 缺点：信息噪音较多，用户可能会被大量不感兴趣的信息淹没
* 智能排序
  * 利用智能算法屏蔽掉违规的、用户不感兴趣的内容。推送用户感兴趣信息来吸引用户
  * 优点：投喂用户感兴趣信息，用户粘度很高，容易沉迷
  * 缺点：如果算法不精准，容易起到反作用

实现方案 1 - 拉模式（读扩散）

![](/images/redis/action/feed/pull.png)

用户主动请求关注的人的最新动态，系统返回最新的动态信息。可以通过 Redis 的 List 数据结构来实现，具体步骤如下：

1. 用户关注其他用户时，将关注者的 ID 存入被关注者的动态列表中。
2. 用户请求动态时，从自己的关注列表中获取所有关注者的动态信息。
3. 系统返回最新的动态信息给用户。

优点：省内存，收件箱在读取消息之后就会被清空，所有消息只会保存在用户自己的发件箱中
缺点：费时，每次读消息都要重新拉取发件箱的消息再做排序，如果关注的人很多，可能会导致请求时间过长

```shell
# 用户关注其他用户
SADD follows:user:1 user:2

# 用户请求动态
LRANGE user:2:feed 0 -1
```

实现方案 2 - 推模式（写扩散）

![](/images/redis/action/feed/push.png)

```shell
# 用户关注其他用户
SADD follows:user:1 user:2

# 用户发布动态
LPUSH user:2:feed "新动态内容"
```

优点：实时性高，被关注者的消息会第一时间推送给关注者并排序
缺点：内存占用高，被关注者的消息会写入每个关注者的收件箱中，可能会导致内存占用过大

实现方案 3 - 混合模式（推拉结合）

![](/images/redis/action/feed/push-pull.png)

也叫读写混合，兼具推模式和拉模式的优点

优点：对于活跃用户，使用推模式，实时性高；对于不活跃用户，使用拉模式，节省内存
缺点：实现复杂，需要维护两种模式的逻辑

三种方案对比

![](/images/redis/action/feed/compare.png)

Feed 流的滚动分页

Feed 流中的数据会不断更新，所以数据的角标也在变化，因此不能采用传统的分页模式，需要使用 sorted set 来实现滚动分页

#### 滚动分页查询

参数

- max：当前时间戳 | 上一次查询的最小时间戳
- min：0 | 固定值
- offset：0 | 在上一次的结果中，与最小值一样的元素的个数
- count：固定值，表示每次查询的最大条数

### 附近商户 - GEO 数据结构

> P88 - P90

GEO 数据结构是 Redis 3.2 版本引入的，用于存储地理位置信息。它可以存储经纬度坐标，并提供一些地理位置相关的操作，如计算距离、查找附近的地点等。

常见的 GEO 命令包括：

- GEOADD：添加地理位置数据，一个 key 可以添加多个地理位置（点）
- GEODIST：计算两个地理位置之间的距离
- GEOHASH：获取地理位置的哈希值
- GEOPOS：获取指定成员的地理位置
- GEORADIUS：查找指定半径内的地理位置
- GEORADIUSBYMEMBER：查找指定成员周围的地理位置
- GEOSEARCH：根据给定的地理位置查找附近的成员
- GEOSEARCHSTORE：将搜索结果存储到新的键中

**附近商户搜索功能实现思路**

按照商户类型做分组，类型相同的商户作为同一组，以 typeId 为 key 存入同一个 GEO 集合中（比如，饭店分一类，超市分一类，KTV 分一类等）

![](/images/redis/action/neighbor.png)

导入店铺数据到 GEO

```java
void loadShopData() {
    // 1. 获取所有店铺数据
    List<Shop> shops = shopService.list();
    // 2. 按照店铺类型分组
    // 这里假设 Shop 类有 getTypeId() 方法返回店铺类型 ID
    Map<Long, List<Shop>> shopMap = shops.stream()
            .collect(Collectors.groupingBy(Shop::getTypeId));
    // 2. 遍历店铺数据，导入到 GEO 中
    for (Map.Entry<Long, List<Shop>> entry : shopMap.entrySet()) {
        // 2.1 获取店铺类型 ID 和对应的店铺列表
        Long typeId = entry.getKey();
        String key = "shop:geo:" + typeId;
        // 2.2 获取同一类型的店铺列表
        List<Shop> shopList = entry.getValue();
        List<GeoLocation<String>> locations = new ArrayList<>();
        // 2.3 遍历店铺列表，构建 GeoLocation 对象
        for (Shop shop : shopList) {
            GeoLocation<String> location = new GeoLocation<>( 
                shop.getId().toString(), 
                new Point(shop.getX(), shop.getY())
            );
            locations.add(location);
        }
        // 2.4 将同一类型的店铺列表添加到 GEO 集合中
        stringRedisTemplate.opsForGeo().add(key, locations);
    }
}
```

查询附近商户

需要注意的是，GEOSEARCH 命令在 Redis 6.2 版本之后才支持，因此需要确保 Redis 版本满足要求，并且要更新 Spring Data Redis 版本到 2.4.0 或更高版本

```java

```

### 用户签到 - BitMap 数据结构

> P91 - P93

用户签到是指用户在特定时间段内访问应用或网站，系统记录用户的访问行为。签到可以用于激励用户活跃度、增加用户粘性等。

数据量估算 - Why BitMap

- 假如我们用一张表来存储用户签到信息，假设用户有 1000 万，每天签到一次，那么每天需要存储 1000 万条记录，一年需要存储 3.65 亿条记录，这样的存储量会非常大。
- 如果使用 BitMap 数据结构，每个用户每天签到一次只需要 1 位来表示，1 个用户签到一个月只需要 2 字节（16 * 2 = 32 位），1000 万用户一年只需要 45 MB 的存储空间。

#### BitMap 用法

BitMap 是一种位图数据结构，可以用来高效地存储和查询大量的二进制数据。每一位代表一个状态，通常用于表示某个用户在某一天是否签到。把每一个 bit 位对应当月的每一天，形成了映射关系。Redis 中的 BitMap 通过 String 类型来实现的，最大上限是 512 M，转换为 bit 则是 2^32 个 bit 位。

BitMap 的常用命令

- `SETBIT key offset value`：设置指定偏移量的位值
- `GETBIT key offset`：获取指定偏移量的位值
- `BITCOUNT key`：计算位图中值为 1 的位数
- `BITPOS key bit [start] [end]`：查找位图中第一个值为 bit 的位的位置
- `BITFIELD key [GET type offset] [SET type offset value]`：对位图执行复杂的位操作
- `BITFIELD_RO key [GET type offset]`：只读的位操作
- `BITOP operation destkey key1 [key2 ...]`：对一个或多个 BitMap 执行位操作（AND、OR、XOR 等）
- `BITPOS key bit [start] [end]`：查找位图中第一个值为 bit 的位的位置

#### 用户签到实现

BitMap 的底层是基于 String 的数据结构，因此其操作也都封装在字符串相关的操作中了

我们想要把用户的 name + 日期作为 key，日期的天数作为 offset，签到状态作为 value 来实现用户签到功能，这样每个用户可以用一个长度为 31 的 BitMap 来表示一个月的签到情况

```java
public void sign(String name) {
    // 1. 获取当前日期
    LocalDate today = LocalDate.now();
    // 2. 计算偏移量，今天是本月的第几天
    int offset = today.getDayOfMonth() - 1;
    // 3. 构建 key
    String key = "sign:" + name + ":" + today.getMonthValue() + ":" + today.getYear();
    // 4. 设置签到状态为 1
    stringRedisTemplate.opsForValue().setBit(key, offset, true);
}
```

#### 签到统计

统计用户的签到情况可以通过 BitMap 的 `BITCOUNT` 命令来实现，计算 BitMap 中值为 1 的位数，即可得到用户的签到天数

问题1：什么叫做连续签到天数？

从最后一次签到开始向前统计，直到遇到第一次未签到的日期为止，计算总的签到天数i，就是连续签到天数

问题2：如何得到本月到今天为止的所有签到数据？

通过 `BITFIELD key GET u[dayOfMonth] 0` 命令

问题3：如何从后向前遍历每个 bit 位？

与 1 做与运算，就能得到最后一个 bit 位，随后右移 1 位，就能得到倒数第二个 bit 位，依次类推

```java
public int countContinuousSign(String name) {
    // 1. 获取当前日期
    LocalDate today = LocalDate.now();
    // 2. 构建 key
    String key = "sign:" + name + ":" + today.getMonthValue() + ":" + today.getYear();
    // 3. 获取今天是本月的第几天
    int dayOfMonth = today.getDayOfMonth();
    // 4. 获取本月到今天为止的所有签到数据，返回的是一个十进制的数字
    List<Long> bitMap = stringRedisTemplate.opsForValue().bitField(key, BitFieldSubCommands
            .create()
            .get(BitFieldSubCommands.BitFieldType.unsigned(dayOfMonth))
            .valueAt(0));
    if (bitMap == null || bitMap.isEmpty()) {
        // 如果没有签到数据，返回 0
        return 0;
    }
    // 5. 统计连续签到天数
    int count = 0;
    Long num = bitMap.get(0);
    while (true) {
        // 6. 判断当前位是否为 1
        if ((num & 1) == 1) {
            // 7. 如果是 1，则连续签到天数 +1
            count++;
        } else {
            // 8. 如果是 0，则结束统计
            break;
        }
        // 9. 将 num 右移一位，继续判断下一个 bit 位
        num >>>= 1;
    }
    return count;
} 
```

### UV 统计 - HyperLogLog 数据结构

> P94 - P95

#### HyperLogLog 用法

首先我们搞懂两个概念：

- UV：
  - Unique Visitor，独立访客，指在一定时间范围内访问过网站的用户数量
  - UV 统计的目的是为了了解网站的访问量和用户活跃度
- PV：
  - Page View，页面浏览量，指网站页面被访问的次数 

UV 统计在服务端做会比较麻烦，因为要判断该用户是否已经统计过了。如果把所有数据都存入 Redis，那数据量会非常大，HyperLogLog 数据结构可以用来高效地统计 UV。

HyperLogLog 是从 Loglog 算法派生的概率算法，用于确定非常大的集合的基数，而不需要存储其所有值。Redis 中的 HLL 是基于 string 结构实现的，单个 HLL 的内存永远小于 16 kb，内存占用低。作为代价，其测量结果是概率性的，有小于 0.81% 的误差率。不过对于 UV 统计来说，这个误差率是可以接受的。

对应的 Redis 命令有：
- `PFADD key element [element ...]`：添加元素到 HyperLogLog 中
- `PFCOUNT key [key ...]`：计算 HyperLogLog 中的基数
- `PFMERGE destkey sourcekey [sourcekey ...]`：合并多个 HyperLogLog 到一个新的 HyperLogLog 中

#### 实现 UV 统计

可以利用单元测试，向 HLL 中添加 100 万条数据，看看内存占用情况（使用 `info memory` 命令查看内存占用）

```java
@Test
void testHyperLogLog() {
    String key = "uv:test";
    String[] values = new String[1000];
    // 添加 100 万条数据
    int j = 0;
    for (int i = 0; i < 1000000; i++) {
      j = i % 1000; // 每 1000 个数据重复一次
      values[j] = "user:" + i;
      if (j == 999) {
        // 每 1000 个数据添加一次
        stringRedisTemplate.opsForHyperLogLog().add(key, values);
      }
    }
    // 计算 UV
    Long count = stringRedisTemplate.opsForHyperLogLog().size(key);
    System.out.println("UV count: " + count);
    // 查看内存占用
    String memoryInfo = stringRedisTemplate.execute((RedisConnection connection) -> {
        return connection.info("memory");
    });
    System.out.println("Memory info: " + memoryInfo);
}
```

## 高级篇

### 分布式缓存

> P96 - P112

单节点 Redis 问题

- 数据丢失 - 单节点 Redis 宕机，数据丢失，服务不可用
- 并发能力 - 无法满足高并发场景下的读写请求
- 故障恢复 - 如果 Redis 宕机，则服务不可用，需要一种自动恢复的机制
- 存储能力 - Redis 基于内存，单节点能存储的数据量有限

解决

- 数据丢失 - 实现数据持久化
- 并发能力 - 实现 Redis 集群
- 故障恢复 - 实现 Redis 主从复制
- 存储能力 - 实现 Redis 分片，利用插槽机制实现动态扩容

#### Redis 持久化

##### RDB 持久化

RDB（Redis Database）是 Redis 的默认持久化方式，它会在指定的时间间隔内将内存中的数据快照保存到磁盘上。RDB 文件是二进制格式的，通常以 `.rdb` 结尾。当 Redis 实例故障重启后，从磁盘读取快照文件，恢复数据。快照文件称为 RDB 文件，默认是保存在当前运行目录。

Redis CLI 中有两个命令可以用来做持久化：

- save：阻塞当前线程，直到持久化完成，适用于服务器停机时的持久化
- bgsave：在后台进行持久化，不会阻塞当前线程，适用于定时持久化

RDB 方案默认是开启的，他会在 Redis 服务器停机的那一刻触发 save 命令完成一次持久化。我们也可以在 `redis.conf` 文件中配置 RDB 的持久化策略，格式如下：

```conf
save <seconds> <changes>
```

这里的 save 是 bgsave，是在后台进行的持久化，命令表示在指定的秒数内，如果有多少次数据变更，则触发一次后台持久化

**RDB 原理**

bgsave 开始时会 fork 主进程得到子进程，子进程共享主进程的内存数据。完成 fork 后读取内存数据并写入 RDB 文件。

fork 采用的是 copy-on-write 的技术

- 当主进程执行读操作时，访问共享内存
- 当主进程执行写操作时，则会拷贝一份数据，执行写操作

![](/images/redis/advance/rdb.png)

**RDB 的缺点**

- 数据丢失：RDB 只会在指定的时间间隔内进行持久化，如果在这个时间间隔内发生了故障，则可能会丢失最近的修改数据
- 耗时：fork 子进程、压缩、写出 RDB 文件都比较耗时

##### AOF 持久化

AOF （Append Only File）是 Redis 的另一种持久化方式，它会将每次对 Redis 数据库的写操作记录到一个日志文件中。AOF 文件是一个文本文件，记录了所有的写操作命令。当 Redis 实例重启时，可以通过执行 AOF 文件中的命令来恢复数据。

AOF 默认是关闭的，可以在 `redis.conf` 文件中配置 AOF 的持久化策略，格式如下：

```conf
# 是否开启 AOF 持久化，默认是 no
appendonly yes
# AOF 文件名
appendfilename "appendonly.aof"
# AOF 同步策略
appendfsync always | everysec | no
```

- appendonly yes：开启 AOF 持久化
- appendfsync always：每次写操作都同步到磁盘，性能较低
- appendfsync everysec：每秒同步一次到磁盘，性能较高，这是默认值
- appendfsync no：不进行同步，性能最高，但数据安全性较低

![](/images/redis/advance/aof.png)

**AOF 原理**

