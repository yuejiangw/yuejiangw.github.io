---
title: Kafka 学习笔记
description: 黑马程序员 Kafka 教程学习笔记
---

课程链接：[bilibili](https://www.bilibili.com/video/BV19y4y1b7Uo/?share_source=copy_web&vd_source=efa6e05f72a153245e41800c27eab04a)

## 消息队列简介

### 消息队列

- 消息队列：用于存放消息的组件
- 程序员可以将消息放入到队列中，也可以从消息队列中获取消息
- 很多时候消息队列不是一个永久性的存储，是作为临时存储存在的（设定一个期限：设置消息在 MQ 中保存 10 天）
- 消息队列中间件：消息队列的组件，例如：Kafka、ActiveMQ、RabbitMQ、RocketMQ、ZeroMQ 等

### 应用场景

#### 1 - 异步处理

比如用户注册场景，可以加快响应速度

- 可以将一些比较耗时的操作放在其他系统中，通过消息队列将需要进行处理的消息进行存储，其他系统可以小费消息队列中的数据
- 比较常见的：发送短信验证码、发送邮件

![](/images/mq/kafka/use-case-async.png)

#### 2 - 系统解耦

比如订单系统和库存系统之间的解耦

- 原先一个微服务是通过接口（HTTP）调用另一个微服务，这时候耦合很严重，只要接口发生变化就会导致系统不可用
- 使用消息队列可以把系统进行解耦合，现在第一个微服务可以将消息放入到消息队列中，另一个微服务可以从消息队列中把消息取出来进行处理，进行系统解耦

![](/images/mq/kafka/use-case-decouple.png)

#### 3 - 流量削峰

常规 MySQL 的吞吐量为 1k 左右，无法承载秒杀场景下的高并发请求，借助 Kafka 的大吞吐量来进行削峰

- 消息队列是低延迟、高可靠、高吞吐的，可以应对大量并发

![](/images/mq/kafka/use-case-cut-edge.png)

#### 4 - 日志处理

大数据领域常见，各大电商网站、App 等需要分析用户行为，根据用户的访问行为来发现用户的喜好，需要在页面上收集大量的用户访问信息

- 可以使用消息队列作为临时村粗，或者是一种通信管道

![](/images/mq/kafka/use-case-log.png)

### 消息队列两种模型

#### 1- 生产者、消费者模型

- 生产者负责将消息生产到 MQ 中
- 消费者负责从 MQ 中获取消息
- 生产者和消费者是解耦的

#### 2- 消息队列模式

- 点对点：一个消费者消费一个消息
- 发布订阅：多个消费者可以消费一个消息

## Kafka 简介

Apache Kafka 是一个分布式流平台，包含 3 点关键能力

1. 发布和订阅数据流，类似于消息队列或者是企业消息传递系统
2. 以容错的持久化方式存储数据流
3. 处理数据流

### Kafka 应用场景

我们通常将 Apache Kafka 用两类程序

1. 建立实时的数据管道，以可靠地在系统或应用程序之间获取数据
2. 构建实时流应用程序，以转换或响应数据流

![](/images/mq/kafka/use-case.png)

关于上图，我们可以看到

- Producers：可以有很多的应用程序，将消息数据放入到 Kafka 集群中
- Consumers：可以有很多应用程序，将消息数据从 Kafka 集群中拉取出来
- Connector：Kafka 的连接器可以将数据库中的数据导入到 Kafka，也可以将 Kafka 的数据导出到数据库中
- Stream Processors：流处理器可以从 Kafka 中拉取数据，也可以将数据写入到 Kafka 中

### Kafka 集群搭建

配置修改

- 每一个 Kafka 节点都需要修改 broker.id（每个节点的标识，不能重复）
- log.dir 数据存储目录需要配置

安装 Kafka 集群，可以测试以下

- 创建一个 topic 主题（消息都是存放在 topic 中，类似 mysql 建表的过程）
- 基于 Kafka 的内置测试生产者脚本来读取标准输入（键盘输入）的数据，并放入到 topic 中
- 基于 Kafka 的内置测试消费者脚本来消费 topic 中的数据

Kafka tool

- 提供了 UI 界面
- 浏览 Kafka 集群节点
- 创建 topic / 删除 topic
- 浏览 Zookeeper 中的数据

## Java 操作 Kafka

导入依赖

```xml
<dependency>
	<groupId>org.apache.kafka</groupId>
	<artifactId>kafka-clients</artifactId>
	<version>3.9.0</version>
</dependency>
```

### 编写生产者程序

> 参考：[java doc](https://kafka.apache.org/39/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html)

```java
public class KafkaProducerTest {
    public static void main(String[] args) {
        // 1. 创建用于连接 Kafka 的 Properties 配置
        Properties props = new Properties();
        
        // bootstrap.servers: Kafka 的服务器地址
        props.put("bootstrap.servers", "localhost:9092");
        
        // acks: 表示当生产者生产数据到 Kafka 中，Kafka 中会以什么样的策略返回
        props.put("acks", "all");
        
        // key.serializer: Kafka 中的消息是以 key、value 键值对存储的，而且生产者生产的消息是需要再网络上传导的
        // 这里指定的是 StringSerializer 方式，就是以字符串方式发送（将来还可以使用其他的一些序列化框架如 Protobuf、Avro 等）
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        
        // value.serializer：同上
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

        // 2. 创建一个生产者对象 KafkaProducer
        Producer<String, String> producer = new KafkaProducer<>(props);
        
        // 3. 发送 1-100 的消息到指定的 topic 中
        for (int i = 0; i < 100; i++) {
            Future<RecordMetadata> future = producer.send(new ProducerRecord<String, String>("my-topic", Integer.toString(i), Integer.toString(i)));
            future.get();
            System.out.println("第 " + i + " 条消息写入成功");
        }
        
        // 4. 关闭生产者
        producer.close();
    }
}
```

### 编写消费者程序

> 参考：[java doc](https://kafka.apache.org/39/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)

- Kafka 是一种拉消息模式的消息队列，在消费者中会有一个 offset，
- `consumer.poll`: Kafka 的消费者是一批一批地拉取数据

```java
public class KafkaConsumerTest {
    public static void main(String[] args) {
        // 1. 创建 Kafka 消费者配置
        Properties props = new Properties();
        props.setProperty("bootstrap.servers", "localhost:9092");
        
        // 消费者组（可以使用消费者组将若干个消费者组织到一起），共同消费 Kafka 中 topic 的数据
        // 每一个消费者需要指定一个消费者组，如果消费者的组名是一样的，表示这几个消费者是一个组中的
        // 一个组中的消费者是共同消费 Kafka 中 topic 的数据
        props.setProperty("group.id", "test");
        
        // 自动提交 offset
        props.setProperty("enable.auto.commit", "true");
        
        // 自动提交 offset 的时间间隔
        props.setProperty("auto.commit.interval.ms", "1000");
        
        // 拉取的 key, value 的反序列化器类型
        props.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        
        // 2. 创建 Kafka 消费者
        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
        
        // 3. 订阅要消费的主题
        // 指定消费者从哪个 topic 中拉取数据
        consumer.subscribe(Arrays.asList("foo", "bar"));
        
        // 4. 使用一个 while 循环，不断从 Kafka 的 topic 中拉取消息
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
            for (ConsumerRecord<String, String> record : records)
                System.out.printf("offset = %d, key = %s, value = %s%n", record.offset(), record.key(), record.value());
        }
    }
}
```

### 异步使用带有回调函数方法生产消息

如果我们想获取生产消息是否成功，或者成功生产消息到 Kafka 后，执行一些其他动作，此时可以很方便地使用带有回调函数来发送消息

- 使用匿名内部类实现 `Callback` 接口，该接口中表示 Kafka 服务器响应给客户端，会自动调用 `onCompletion` 的方法
  - metadata: 消息的元数据（属于哪个 topic、属于哪个 partition、对应的 offset 是什么）
  - exception: 这个对象 kafka 生产消息封装了出现的异常，如果为 null，表示发送成功，如果不为 null，表示出现异常

```java
public class KafkaProducerTest {
    public static void main(String[] args) {
        // 1. 创建用于连接 Kafka 的 Properties 配置
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("acks", "all");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

        // 2. 创建一个生产者对象 KafkaProducer
        Producer<String, String> producer = new KafkaProducer<>(props);
        
        // 3. 使用异步回调方式发送消息
        for (int i = 0; i < 100; i++) {
            ProducerRecord<String, String> producerRecord = new ProducerRecord<>("my-topic", Integer.toString(i), Integer.toString(i));
            producer.send(producerRecord, new Callback() {
                @Override
                public void onCompletion(RecordMetadata metadata, Exception exception) {
                    // 判断发送消息是否成功
                    if (exception == null) {
                        String topic = metadata.topic();
                        int partition = metadata.partition();
                        long offset = metadata.offset();
                        System.out.println("topic: " + topic + " 分区 id: " + partition + " 偏移量: " + offset);
                    } else {
                        System.out.println("生产消息出现异常");
                        System.out.println(exception.getMessage());
                        System.out.println(exception.getStackTrace());
                    }
                }
            });
        }
        
        // 4. 关闭生产者
        producer.close();
    }
}
```

## 架构

### Kafka 中的重要概念

#### broker

- 一个 kafka 的集群通常由多个 broker 组成，这样才能实现负载均衡、以及容错
- broker 是无状态的，它们是通过 Zookeeper 来维护集群状态
- 一个 kafka 的 broker 每秒可以处理数十万次读写，每个 broker 都可以处理 TB 级别的消息而不影响性能

![](/images/mq/kafka/broker.png)

#### zookeeper

- 用来管理和协调 broker，并且存储了 Kafka 的元数据（例如，有多少 topic、partition、consumer）
- 主要用于通知生产者和消费者 kafka 集群中有新的 broker 加入、或者 Kafka 集群中出现故障的 broker

PS: Kafka 正在想办法将 Zookeeper 剥离，维护两套集群成本较高，社区提出 KIP-500 就是要替换掉 ZooKeeper 的依赖 - Kafka on Kafka

#### producer

- 生产者负责将数据推送给 broker 的 topic

#### consumer

- 消费者负责从 broker 的 topic 中拉取数据，并自己处理

#### consumer group

- 消费者组是 Kafka 提供的可扩展且具有容错性的消费者机制
- 一个消费者组可以包含多个消费者
- 一个消费者组有一个唯一的 ID（group id）
- 组内的消费者一起消费主题的所有分区数据
- 一个消费者组中，一个分区只能由一个消费者消费，一个消费者可以消费多个分区

![](/images/mq/kafka/consumer-group.png)

#### 分区（partition）

- 在 Kafka 集群中，主题被分为多个分区

![](/images/mq/kafka/partition.png)

#### 副本（replica）

- 副本可以确保某个服务器出现故障时，确保数据依然可用
- 在 kafka 中，一般设计副本数 > 1

![](/images/mq/kafka/replica.png)

#### 主题（Topic）

- 主题是一个逻辑概念，用户生产者发布数据，消费者拉取数据
- Kafka 中的主题必须要有标识符，而且是唯一的，Kafka 中可以有任意数量的主题，没有数量上的限制
- 在主题中的消息是有结构的，一般一个主题包含某一类消息
- 一旦生产者发送消息到主题中，这些消息就不能被更新（更改）

![](/images/mq/kafka/topic.png)

#### 偏移量（Offset）

- Offset 记录着下一条将要发送给 Consumer 的消息序号
- 默认 Kafka 将 offset 存储在 ZooKeeper 中（也可以配置存储其他地方如 Redis，但默认是放在 ZooKeeper 中）
- 在一个分区中，消息是有顺序的方式存储着，每个在分区的消费都是有一个递增的 id，这个就是偏移量 offset
- 偏移量在分区中才是有意义的，在分区之间，offset 是没有任何意义的

![](/images/mq/kafka/offset.png)

### 消费者组

- 一个消费者组中可以包含多个消费者，共同来消费 topic 中的数据
- 一个 topic 中如果只有一个分区，那么这个分区只能被某个组中的一个消费者消费
- 有多少个分区，那么就可以被同一个组内的多少个消费者消费

## Kafka 生产者幂等性与事务

在生产者生产消息时，如果出现 retry 时，有可能会一条消息被发送了多次，如果 Kafka 不具备幂等性，就有可能会在 partition 中保存多条一模一样的消息

### 幂等性原理

为了实现生产者幂等性，Kafka 引入了 Producer ID（PID）和 Sequence Number 的概念

- PID：每个 Producer 在初始化时，都会分配一个唯一的 PID，这个 PID 对用户来说，是透明的
- Sequence Number：针对每个生产者（对应 PID）发送到指定主题分区的消息都对应一个从 0 开始递增的 Sequence Number

发送流程

- 当 Kafka 的生产者生产消息时，会增加一个 pid（生产者的唯一编号）和 Sequence Number（针对消息的一个递增序列）
- 发送消息，会连着 pid 和 sequence number 一块发送
- Kafka 接收到消息，会将消息和 pid、sequence number 一并保存下来
- 如果 ack 响应失败，生产者重试，再次发送消息时，Kafka 会根据 pid 和 sequence number 来判断是否需要再保存一条消息
- 判断条件：生产者发送过来的 sequence number 是否小于等于 partition 中消息对应的 sequence number

![](/images/mq/kafka/idempotence.png)

## 分区和副本机制

### 生产者分区写入策略

#### 1 - 轮询

- 默认的策略，也是使用最多的策略，可以最大限度保证所有消息平均分配到一个分区
- 如果在生产消息时，key 为 null，则使用轮询算饭均衡地分配分区

![](/images/mq/kafka/round-robin.png)

#### 2 - 随机（不用）

随机策略，每次都随机地将消息分配到每个分区。在较早版本，默认的分区策略就是随机策略，也是为了将消息均衡地写入到每个分区。但后续轮询策略表现更佳，所以基本上很少会使用随机策略。

![](/images/mq/kafka/random.png)

#### 3 - 按 key 分配

按 key 分配策略，有可能会出现数据倾斜（，例如：某个 key 的数据量比较大，因为 key 值一样，则所有数据都将分配到一个分区中，造成该分区的消息数量远大于其他的分区

![](/images/mq/kafka/key-based.png)

> - 轮询策略、随机策略都会导致一个问题，生产到 Kafka 中的数据是乱序存储的。
> - 按 key 分区可以一定程度上实现数据有序存储 —— 也就是局部有序，但这又可能会导致数据倾斜，所以在实际生产环境中要结合实际情况来做取舍。

![](/images/mq/kafka/order.png)

### 消费者组的 rebalance 机制

Kafka 中的 Rebalance 称之为再均衡，是 Kafka 中确保 consumer group 下所有的 consumer 如何达成一致，分配订阅的 topic 的每个分区的机制

Rebalance 触发的时机有：

1. 消费者组中的 consumer 个数发生变化。例如：有新的 consumer 加入到消费者组，或者是某个 consumer 停止了
2. 订阅的 topic 数量发生了变化：消费者可以订阅多个主题，假设当前的消费者组订阅了三个主题，但有一个主题突然被删除了，此时也需要发生再均衡
3. 订阅的 topic 的 partition 数量发生了变化

Rebalance 的不良影响

- 发生 Rebalance 时，consumer group 下的所有 consumer 都会协调一起共同参与，Kafka使用分配策略尽可能达到最公平的分配
- Rebalance 过程会对 consumer group 产生非常严重的影响，Rebalance 的过程中所有的消费者都将停止工作，直到 Rebalance 完成

### 消费者分区分配策略

#### Range - 范围分配策略

是 Kafka 的默认分配策略，它可以确保每个消费者消费的分区数量是均衡的。注意：Range 范围分配策略是针对每个 topic 的

**配置：** 配置消费者的 `partition.assignment.strategy` 为 `org.apache.kafka.clients.consumer.RangeAssignor`

算法公式：

- n = 分区数量 / 消费者数量
- m = 分区数量 % 消费者数量
- 前 m 个消费者消费 n + 1 个，剩余消费者消费 n 个

![](/images/mq/kafka/range.png)


#### RoundRobin - 轮询策略

RoundRobinAssignor 轮询策略是将消费者组内所有消费者以及消费者所订阅的所有 topic 的 partition 按照字典序排序（topi 和分区的 hashcode进行排序），然后通过轮询方式逐个将分区以此分配给每个消费者

**配置：** 配置消费者的 `partition.assignment.strategy` 为 `org.apache.kafka.clients.consumer.RoundRobinAssignor`

![](/images/mq/kafka/consumer-round-robin.png)

#### Sticky - 粘性分配策略

从 Kafka 0.11.x 开始，引入此类分配策略，主要目的：

1. 分区分配尽可能均匀
2. 在发生 rebalance 的时候，分区的分配尽可能与上一次保持相同

没有发生 rebalance 时，sticky 粘性分配策略和 RoundRobin 类似

举例：

![](/images/mq/kafka/sticky-1.png)

上图中如果 consumer2 崩溃了，此时需要进行 rebalance，如果是 range 或 round robin，则都会重新进行分配

![](/images/mq/kafka/sticky-2.png)

通过上图我们可以看到，consumer0 和 consumer1 原来消费的分区大多发生了改变，接下来再看粘性分配策略

![](/images/mq/kafka/sticky-3.png)

可以看到，sticky 粘性分配策略，保留了 rebalance 之前的分配结果，只是将原先 consumer2 负责的两个分区再均匀分配给 consumer0、consumer1，这样可以明显减少系统资源的浪费

### 副本机制

副本的目的就是冗余备份，当某个 Broker 上的分区数据丢失时，依然可以保障数据可用，因为在其他 Broker 上的副本是可用的

#### producer 的 ACKs 参数

producer 配置的 ack 参数表示当生产者生产消息的时候，写入到副本的要求严格程度，它决定了生产住如何在性能和可靠性之间做取舍

配置：

```java
public static void main(String[] args) {
  Properties props = new Properties();
  props.put("bootstrap.servers", "node1.itcast.cn:9092");
  props.put("acks", "all");
  props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
  props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
}
```

`props.put("acks", "all");` 配置了 producer 需要要等待的副本数量

- acks = 0：生产者只管写入，不管是否写入成功，可能会数据丢失，性能最好
- acks = 1：生产者会等到 leader 分区写入成功后，返回成功，接着发送下一条数据
- acks = -1 / all：确保消息写入到 leader 分区和对应副本都成功后才发送下一条，性能最差，安全性最高

要根据业务情况来选择 ack 机制

分区中是有 leader 和 follower 的概念的，为了确保消费者消费的数据是一致的，只能从分区 leader 去读写消息，follower 做的事情就是同步数据，backup

## 高级 API 与低级 API

### 高级 API

之前在编写生产者程序和消费者程序的时候用到的 Java 代码就是 Kafka 的高级 API，高级 API 就是直接让 Kafka 帮助管理、处理分配、数据

- 不需要执行去管理 offset，直接通过 Zookeeper 管理，也不需要管理分区、副本，由 Kafka 统一管理
- 消费者会自动根据上一次在 Zookeeper 中保存的 offset 去接着获取数据
- 在 ZK 中，不同的消费者组同一个 topic 记录不同的 offset，这样不同程序读取同一个 topic，不会受 offset 的影响
- 开发起来比较简单，无需开发者关注底层细节

高级 API 缺点

- 不能控制 offset，例如：想从指定的位置读取
- 不能细化控制分区、副本、ZK 等

### 低级 API

通过使用低级 API，我们可以自己来控制 offset，想从哪读，就可以从哪读。而且，可以自己控制连接分区，对分区自定义负载均衡。而且，之前 offset 是自动保存在 ZK 中，使用低级 API，我们可以将 offset 不一定要使用 ZK 存储，可以自己来存储 offset

低级 API 缺点

- 原有的 Kafka 策略会失效，需要我们自己来实现

## Kafka 原理

### 分区的 leader 与 follower

在 Kafka 中，每个 topic 都可以配置多个分区以及多个副本，每个分区都有一个 leader 以及 0 或多个 follower。在创建 topic 时， 
Kafka 会自动将 leader 均匀地分配在不同的 broker 中，如果一个 broker 上有多个分区的 leader，就出现了不均衡的情况，应该尽量让 leader 均匀分配。

所有的读写操作都是由 leader 处理，而所有的 follower 都复制 leader 的日志数据文件，如果 leader 出现故障时，follower 就被选举为 leader

- Kafka 中的 leader 负责处理读写操作，而 follower 只负责副本数据的同步
- 如果 leader 出现故障，其他 follower 会被重新选举为 leader
- follower 像一个 consumer 一样，拉取 leader 对应分区的数据，并保存到日志数据文件中
- 注意和 ZooKeeper 的区分
  - ZK 的 leader 负责读写、follower 不能读写数据（确保每个消费者消费的数据是一致的）
  - Kafka 一个 topic 有多个分区 leader，一样可以实现数据操作的负载均衡

![](/images/mq/kafka/leader-follower.png)

### AR, ISR, OSR

- 分区的所有副本称为 `AR`（Assigned Replicas ——— 已分配的副本）
- 所有与 leader 副本保持一定程度同步的副本（包括 leader 副本在内）组成 `ISR`（in-sync replicas —— 在同步中的副本）
- 由于 follower 副本同步滞后过多的副本（不包括 leader 副本）组成 `OSR`（Out-of-sync Replicas）
- AR = ISR + OSR
- 正常情况下，所有的 follower 副本都应该于 leader 副本保持同步，即 AR = ISR，OSR 集合为空

![](/images/mq/kafka/ar-isr-osr.png)

### Leader 选举

- Controller：是 Kafka 集群的老大，是针对 Broker 的一个角色
  - 是高可用的，是通过 ZK 来进行选举
- Leader：是针对 partition 的一个角色
  - 通过 ISR 来进行快速选举
- 如果 Kafka 是基于 ZK 来进行选举，ZK 的压力可能会比较大。例如：某个节点崩溃，这个节点上不仅仅只有一个 leader，是有不少的 leader 需要选举，通过 ISR 快速进行选举
- Leader 负载均衡
  - 如果某个 broker 宕机之后，就可能会导致 partition 的 leader 分布不均匀，就是一个 broker 上存在一个 topic 下不同 partition 的 leader

### 生产、消费数据工作原理

#### 生产 - 写流程

![](/images/mq/kafka/produce.png)

- 通过 ZK 找 partition 对应的 leader，leader 是负责读写的
- producer 开始写入数据
- ISR 里面的 follower 开始同步数据，并返回给 leader ACK
- 返回给 producer ACK

#### 消费 - 读流程

![](/images/mq/kafka/consume.png)

- Kafka 采用拉取模型，由消费者自己记录消费状态，每个消费者互相独立地顺序拉取每个分区的消息
- 消费者可以按照任意的顺序消费消息。比如，消费者可以重置到旧的偏移量，重新处理之前已经消费过的消息；或者直接跳到最近的位置，从当前的时刻开始消费

![](/images/mq/kafka/consume-2.png)

- 每个 consumer 都可以根据分配策略（默认 RangeAssignor），获得要消费的分区
- 获取到 consumer 对应的 offset（默认从 ZK 中获取上一次消费的 offset）
- 通过 ZK 找到该分区的 leader，然后开始从 offset 往后顺序拉取数据
- 消费者提交 offset（自动提交 —— 每隔多少秒提交一次 offset、手动提交 —— 放入到事务中提交）

### Kafka 的数据存储形式

- 一个 topic 由多个分区组成
- 一个分区由多个 segment（段）组成
- 一个 segment 由多个文件组成（log、index、timeindex）

![](/images/mq/kafka/storage.png)

