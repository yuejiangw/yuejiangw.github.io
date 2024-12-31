---
title: Feed 流
description: Feed 流简介及实现
---

## 简介

Feed 流（news feed）也可以称为关注推送，直译为 `投喂`，为用户持续地提供 “沉浸式” 的体验，通过无限下拉刷新获取新的消息

对比

- 传统模式：用户主动寻找内容
- Feed 模式：内容主动匹配用户

### Feed 流的模式

Feed 流产品有两种常见模式

- **Timeline**: 不做内容筛选，简单的按照内容发布时间排序，常用于好友或关注，例如朋友圈
  - 优点：信息全面，不会有确实，并且实现也相对简单
  - 缺点：信息噪音较多，用户不一定感兴趣，内容获取效率低
- **智能排序**: 利用智能算法屏蔽掉违规的、用户不感兴趣的内容，推送用户感兴趣信息来吸引用户
  - 优点：投喂用户感兴趣信息、用户粘度很高，容易沉迷
  - 缺点：如果算法不精准，可能起到反作用

我们主要讨论基于关注的好友来做 Feed 流，因此采用 Timeline 模式，这种模式的实现方案有三种：

- 拉模式
- 推模式
- 推拉结合

### 拉模式 - Pull

也叫读扩散

![](/images/system/news-feed/pull.png)

如图所示，张三、李四、王五会把新消息附带一个时间戳发送到各自的**发件箱**中，赵六在主动读取消息的时候会把他关注的人的消息拉到自己的**收件箱**中，并按照时间戳排序

- 优点：节省内存空间，收件箱在读取过之后就不用了，无需存储，信息只需要存在发件箱中即可
- 缺点：每次读消息的时候都要拉去发件箱的消息再做排序，耗时比较高，尤其是当某个人关注了很多人的时候，刷新延迟会很高

### 推模式 - Push

也叫写扩散

![](/images/system/news-feed/push.png)

如图所示，张三、李四在发送新消息的时候，会直接把消息推送到各自粉丝的收件箱内，并按时间排好序，这样就无需发件箱暂存消息

- 优点：延时低
- 缺点：一条消息需要写多次，内存占用比较高

### 推拉结合 - Hybrid

也叫做读写混合，兼具推和拉两种模式的优点

对于活跃粉丝，采用推模式；对于普通粉丝，采用拉模式，既节省了内存，又照顾了活跃用户的感受

![](/images/system/news-feed/hybrid.png)

### 对比

![](/images/system/news-feed/compare.png)

## 案例

基于推模式实现关注推送的功能

需求

1. 修改新增探店笔记的业务，在保存 blog 到数据库的同时，推送到粉丝的收件箱
2. 收件箱满足可以根据时间戳排序，必须用 Redis 的数据结构实现
3. 查询收件箱数据时，可以实现分页查询

### Feed 流的分页问题

传统的分页方式中，我们会记录 page size 和 current page number，计算偏移量之后通过角标形式访问。 Feed 流中的数据会不断更新，所以数据的角标也在变化，不能采用传统的分页模式，需要使用滚动分页的方式。

滚动分页中，我们记录每次查询的最后一条数据的 id (`lastId`)，下一次从这个位置开始查。这种分页方式决定了我们要使用 SortedSet 而不是 List 作为收件箱的数据结构，因为在 List 中只能按照角标进行查询。

![](/images/system/news-feed/pagination.png)

### 实现

```java
@Override
public Result saveBlog(final Blog blog) {
    // 获取登录用户
    UserDTO user = UserHolder.getUser();
    blog.setUserId(user.getId());
    // 保存探店笔记
    final boolean isSuccess = save(blog);
    if (!isSuccess) {
        return Result.fail("保存笔记失败");
    }
    // 查询笔记作者的所有粉丝 select * from tb_follow where follow_user_id = ?
    final List<Follow> follows = followService.query().eq("follow_user_id", user.getId()).list();
    // 推送笔记 id 给所有粉丝，利用 Redis 的 SortedSet 结构作为收件箱
    for (Follow follow : follows) {
        // 获取粉丝 id
        Long userId = follow.getUserId();
        // 推送
        String key = "feed:" + userId;
                stringRedisTemplate.opsForZSet().add(key, blog.getId().toString(), System.currentTimeMillis());
    }
    // 返回id
    return Result.ok(blog.getId());
}
```

滚动分页查询参数

```text
max: 当前时间戳 | 上一次查询的最小时间戳
min: 0
offset: 0 | 在上一次的结果中，与最小值一样的元素个数
count: 3
```

