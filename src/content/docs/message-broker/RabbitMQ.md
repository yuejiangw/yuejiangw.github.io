---
title: RabbitMQ 学习笔记
---

> 课程链接：[bilibili](https://www.bilibili.com/video/BV1mN4y1Z7t9/?vd_source=734a4a3d12292363fc3078169ddd7db2)
> P1 - P15

## 同步和异步

### 同步调用

优势：

- 时效性强，等待到结果后才返回

问题：

- 拓展性差：各个服务耦合度高，不易拓展
- 性能下降：多个服务需要依次等待上一个服务执行完毕才可以开始运行，性能低
- 级联失败：如果中间有某一个服务宕机的话则后续的所有服务都无法继续运行，并且该停机可能会传播到上级服务中，引发全线崩溃

### 异步调用

![](/images/mq/basic/async.png)

![](/images/mq/basic/async-architecture.png)

异步调用的优势和劣势与同步调用刚好是反过来的

优势：

- 耦合度低，拓展性强
- 异步调用，无需等待，性能好
- 故障隔离，下游服务故障不影响上游业务
- 缓存消息，流量削峰填谷

劣势：

- 不能立即得到调用结果，时效性差
- 不确定下游业务是否执行成功
- 业务安全依赖于 Broker （消息代理）的可靠性

## MQ 技术选型

![](/images/mq/basic/selection.png)

使用场景：

- Kafka：吞吐量很高的情况，比如日志收集
- RabbitMQ：可靠性高，语言不限于 Java，消息延迟低
- RocketMQ：可靠性高，Java 项目

## 认识和安装

### 安装

在 Mac 环境下通过 Homebrew 安装

```shell
brew install rabbitmq
```

启动服务，默认端口是 15672

```shell
brew services start rabbitmq
```

访问管理页面

- url: http://localhost:15672
- username: guest
- password: guest

### 基本介绍

**发送模型**

publisher 生产者发消息给 exchange (交换机)，exchange 负责将消息路由给 queue (队列)，consumer (消费者) 监听队列从而拿到消息

![](/images/mq/basic/basic-concept.png)

交换机是负责路由和转发消息的，它本身没有存储消息的能力

**快速入门**

创建一个新的 queue

![](/images/mq/basic/create-queue.png)

exchange 绑定 queue

![](/images/mq/basic/exchange-bind.png)

Publish message

![](/images/mq/basic/publish-message.png)

Get message

![](/images/mq/basic/get-message.png)

## 数据隔离

添加用户

![](/images/mq/basic/add-user.png)

这里我们添加了一个名为 `hmall` 的管理员账户，尽管它可以看到我们在上一步骤中创建的 `hello.queue1` 和 `hello.queue2` 两个队列，但它却无权访问（get message 会出错）。这是因为上面两个队列是在不同的 virtual host 中创建的，可见 RabbitMQ 通过 Virtual Host 实现了数据隔离。

创建虚拟主机（Virtual host）

![](/images/mq/basic/add-virtual-host.png)

添加了新的 virtual host 之后我们再次查看 exchanges 页面，会发现这次会多出我们 virtual host 下的 exchange

![](/images/mq/basic/all-exchange.png)

## work模式

一个队列上绑定多个消费者的模式叫 work 模式，这样做的目的是为了增加处理能力，避免消息堆积

默认情况下，`RabbitMQ` 会将消息依次轮询投递给绑定在队列上的每一个消费者，但这并没有考虑到不同消费者的消费能力的区别，可能会导致消息堆积

**解决方案：**

修改 `application.yml`，设置 `preFetch` 值为 1， 确保同一时刻最多投递给消费者 1 条消息，实现能者多劳

![](/images/mq/basic/preFetch.png)

## 交换机

交换机的作用是：

- 接收 publisher 发送的消息
- 将消息按照规则路由到与之绑定的队列

### 交换机类型

#### Fanout：广播

Fanout Exchange 会将接收到的消息广播到每一个跟其绑定的 queue，所以也叫广播模式

#### Direct：定向

![](/images/mq/basic/direct-exchange.png)

#### Topic：话题

![](/images/mq/basic/topic-exchange.png)

Topic 交换机是最灵活的一种交换机，可以模拟 Direct 和 Fanout，并且可以使用通配符，如果不确定要使用哪种 exchange 则推荐使用 Topic

Direct 交换机与 Topic 交换机的差异

- Topic 交换机中 routing key 可以是多个单词，以 `.` 分割
- Topic 交换机与队列绑定时的 binding key 可以指定通配符
- `#` 代表 0 个或多个词
- `*` 代表 1 个词

## SpringAMQP

#### AMQP & Spring AMQP

**AMQP**：Advanced Message Queuing Protocol, 用来在应用程序之间传递业务消息的开放标准，该协议与平台语言无关

**Spring AMQP**：基于 AMQP 协议定义的一套 API 规范，提供了模板来发送和接收消息，包含两部分，其中 `spring-amqp` 是基础抽象，`spring-rabbit` 是底层的默认实现

#### 快速入门

项目地址：[Github](https://github.com/226wyj/rabbitmq-learn/tree/main/mq-demo)

使用步骤：

- 引入 `spring-boot-starter-amqp` 依赖
- 配置 `rabbitmq` 服务端信息
- 利用 `RabbitTemplate` 发送消息
- 利用 `@RabbitListener` 注解声明要监听的队列，监听消息

注意：对于 RabbitMQ，控制台页面的端口是 15672，但正常队列的端口是 5672

#### 通过 SpringAMQP 配置 RabbitMQ

常用类：

![](/images/mq/basic/queue+exchange.png)

基于 `@Configuration` 注解和 `@Bean` 注解声明和配置 Exchange，以 Fanout 为例：

![](/images/mq/basic/exchange-sample.png)

推荐使用基于 `@RabbitListener` 注解的方式来进行配置而不是使用 `@Bean` 进行依赖注入，后者在配置 Direct Exchange 的时候对于每个 Bean 每次只能指定一个 key，如果一个 Queue 要是想绑定多个 key 的话就要声明多个 Bean，比较麻烦

![](/images/mq/basic/annotation-based-exchange-config.png)

## MQ消息转换器

Spring 中默认使用 JDK 自带的 ObjectOutputStream 进行序列化，因此如果我们想给 MQ 发送一个 Object，则会被 convert 成一个字节码序列

![](/images/mq/basic/default-converter.png)

解决：使用 JSON 序列化替代默认的 JDK 序列化

![](/images/mq/basic/json-converter.png)

## 发送者的可靠性

**生产者重连**

![](/images/mq/advance/producer-retry.png)

**生产者确认**

![](/images/mq/advance/producer-confirm.png)

如何处理生产者的确认消息？

* 尽管有四种情况，但我们真正需要处理的只有 NACK 这一种，即消息 publish 失败
* 生产者确认需要额外的网络和系统资源开销，尽量不要使用，如果一定要使用则无需开启 `Publisher-Return` 机制，只开启 `Publisher-Confirm` 即可，因为一般路由失败是代码问题
* 对于 nack 消息可以有限次数重试，依然失败则记录异常信息

## MQ 的可靠性

默认情况下 RabbitMQ 会把消息存放在内存中，尽管效率高但会有两个问题：

- 一旦 MQ 宕机，内存中的消息会消失
- 内存空间有限，当消费者故障或处理过慢时，会导致消息积压，引发 MQ 阻塞

### 数据持久化

可以通过配置让交换机、队列、以及发送的消息都持久化，这样队列中的消息会持久化到磁盘，MQ 重启消息依然存在

### Lazy Queue

惰性队列，接收到消息后直接存入磁盘而非内存（内存中只保留最近消息，默认 2048 条），消费者要消费消息时才会从磁盘中读取加载到内存，可以支持数百万条的消息存储

要设置一个队列为 Lazy Queue，只需要在声明队列时指定 `x-queue-mode` 为 lazy 即可

```java
// 直接创建 Queue 对象
@Bean
public Queue lazyQueue() {
   return QueueBuilder
            .durable("lazy.queue")
            .lazy() // 开启 lazy 模式
            .build();
}

// 基于 @RabbitListener 注解创建 Queue
@RabbitListener(queuesToDeclare = @Queue(
   name = "lazy.queue",
   durable = "true",
   arguments = @Argument(name = "x-queue-mode", value = "lazy")
))
public void listenLazyQueue(String msg) {
   log.info("接收到 lazy.queue 的消息: {}", msg);
}
```

## 消费者的可靠性

### 消费者确认机制

为了确认消费者是否成功处理消息，RabbitMQ 提供了消费者确认机制（Consumer Acknowledgement），当消费者处理消息结束后应该向 RabbitMQ 发送一个回执，有三种值：

- ack：成功处理消息，MQ 从队列中删除消息
- nack：消息处理失败，MQ 需要再次投递消息
- reject：消息处理失败并拒绝该消息，MQ 从队列中删除消息

什么时候会 reject：消息本身是有问题的，consumer 处理的时候会报错

![](/images/mq/advance/consumer-ack.png)

```txt
spring:
  rabbitmq:
    listener:
      simple:
        prefetch: 1
          acknoledge-mode: none # none, 关闭 ack; manual, 手动 ack; auto: 自动 ack
```

我们把 ack mode 设置成 `auto` 之后会使可靠性大大增强，只有消费者处理成功之后消息才会被移除，否则消息会被重新投递

### 消费失败处理

如果我们只是把 ack mode 设置成 auto 就不管了，那么消费者出现异常后，消息会不断 requeue 到队列，再重新发送给消费者，然后再次出现异常，从而无限循环。我们可以使用 Spring 的 retry 机制，在消费者出现异常时利用本地重试，而不是无限制 requeue 到 mq 队列

```txt
spring:
  rabbitmq:
    listener:
      simple:
        prefetch: 1
          retry:
            enabled: true # 开启本地重试
            initial-interval: 1000ms # 初始的失败等待时长为 1s
            multiplier: 1 # 下次失败的等待时长倍数，下次等待时长 = multiplier * (last-interval)
            max-attempts: 3 # 最大重试次数
            stateless: true # true 无状态 false 有状态，如果业务中包含事务使用 false
```

重试多次依旧失败则需要有 `MessageRecoverer` 接口来处理

- RejectAndDontRequeueRecoverer: 重试耗尽后直接 reject，默认就是这种方式
- ImmediateRequeueMessageRecoverer: 重试耗尽后返回 nack，消息重新入队
- RepublishMessageRecoverer: 重试耗尽后将失败消息投递到指定的交换机

### 业务幂等性

即业务多次重复处理的结果和只处理一次的结果是相同的

#### 方案一：唯一消息 id

- 给每个消息都设置一个唯一的 id，与消息一起投递给消费者
- 消费者收到消息后处理自己的业务，业务处理成功后将消息 id 保存到数据库
- 如果下次又收到相同消息，去数据库查询判断是否存在，存在则为重复消息放弃处理

```java
@Bean
public MessageConverter messageConverter() {
    // 1. 定义消息转换器
    Jackson2JsonMessageConverter jjmc = new Jackson2JsonMessageConverter();
    // 2. 配置自动创建消息 id，用于识别不同消息，也可以在业务中基于 id 判断是否是重复消息
    jjmc.setCreateMessageIds(true);
    return jjmc
}
```

缺点：对原有业务有侵入，并且增加了写数据库步骤，性能会有影响

#### 方案二：业务判断

结合业务逻辑，基于业务本身做判断

![](/images/mq/advance/idempotence.png)

## 延迟消息

- 延迟消息：生产者发送消息时指定一个时间，消费者不会立刻收到消息，而是在指定时间之后才收到消息
- 延迟任务：设置在一定时间之后才执行的任务

应用场景：订单支付倒计时

### 死信交换机

当一个队列中的消息满足下面条件之一时就是死信（dead letter）：

- 消费者使用 basic.reject 或 basic.nack 声明消费失败，并且消息的 requeue 参数设置为 false
- 消息时一个过期的消息（达到了队列或消息本身设置的过期时间），超时无人消费
- 要投递的队列消息堆积满了，最早的消息可能成为死信

如果队列通过 dead-letter-exchange 属性指定了一个交换机，那么该队列中的死信就会投递到这个交换机中，这个交换机被称为死信交换机（Dead letter exchange，简称 DLX）

### 延迟消息插件

RabbitMQ 的官方也推出了一个插件，原生支持延迟消息的功能。该插件的原理是设计了一种支持延迟消息功能的交换机，当消息投递到交换机后可以暂存一定时间，到期后再投递到队列

### 取消超时订单

设置 30 min 后检测订单支付状态存在两个问题：

- 如果并发较高，30 min 后可能堆积消息过多
- 大多数订单很快就会支付，却需要再 MQ 内等待 30 min，浪费资源

解决：把一个长的延迟消息分成多个短的延迟消息，比如 10s, 10s, 10s, 15s, 15s, ..., 10min，这个延迟序列中前面的时间较短，后面的时间较长，从而保证大部分的消息可以在前面较短的时间内就被处理完

![](/images/mq/advance/pay-status.png)