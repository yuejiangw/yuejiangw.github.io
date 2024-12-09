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

## 基于 Redis 的分布式锁的优化

### 目前问题

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

### Redisson 简介

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

## 异步秒杀

首先来回顾先前的秒杀流程

![](/images/redis/action/voucher/original-seckill.png)

可以发现，在查询优惠券、查询订单、减库存、创建订单这四步中都要访问数据库，而数据库本身的并发能力比较差，因此现有的秒杀流程性能是不高的

**优化思路**

判断秒杀库存和校验一人一单这两部分耗时是较短的，可以分离出来由一个线程独立完成，另外的四个步骤交给另外一个线程来做

- 订单信息可以存储在 Redis 中，借助 Redis 完成库存判断和一人一单校验，之后保存优惠券 id，用户 id，和订单 id 到阻塞队列
- 另外的线程异步读取阻塞队列中的信息，完成下单处理
- 关于 Redis 数据结构，库存信息通过 int 类型存储，一人一单校验通过 set 类型存储

![](/images/redis/action/voucher/updated-seckill.png)

**优化后的流程**

![](/images/redis/action/voucher/updated-workflow.png)