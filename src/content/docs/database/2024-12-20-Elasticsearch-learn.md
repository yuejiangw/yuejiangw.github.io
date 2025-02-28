---
title: ElasticSearch 学习笔记 - Legacy
description: 学习记录
---

> 课程：[狂神说 Java ElasticSearch 7.6.x](https://www.bilibili.com/video/BV17a4y1x7zq)

# 诞生背景


## 核心概念

Elasticsearch（集群）中可以包含多个索引（数据库），每个索引中可以包含多个文档（行），在 ES 7 及之前的版本中还有一个概念叫 type，类似与 MySQL 中的表，不过在 ES 8 中已经废弃。下表是 ES 与 MySQL 的概念类比以供参考：

![](/images/elasticsearch/compare-with-mysql.png)

### 物理设计

Elasticsearch 在后台把每个索引划分成多个分片，每个分片可以在集群中不同服务器间迁移，一个人就是一个集群，默认的集群名称是 `elasticsearch`

### 逻辑设计

#### 文档（document）

ES 是面向文档的，那么意味着索引和搜索数据的最小单位是文档。ES 中，文档有几个重要属性：

- 自我包含，一篇文档同时包含字段和对应的值，也就是同时包含 key 和 value
- 可以是层次型的，一个文档中包含其他文档（就是一个 JSON 对象）
- 灵活的结构，文档不依赖预先定义的模式，与关系数据库有很大的不同

#### 索引（index）

就是数据库，ES 中的索引是一个非常大的文档集合。索引存储了映射（mappings）和其它设置，它们被存储到了各个分片上

一个集群至少有一个节点，而一个节点就是一个 ES 进程，节点可以有多个索引。如果你创还能索引，默认情况下索引会有 5 个分片（primary shard，又称主分片）构成的，每一个主分片还会有一个副本（replica shard，又称复制分片）

![](/images/blog/elasticsearch/physical-shard.png)

上图是一个有 3 个节点的集群，可以看到主分片和对应的复制分片都不会再同一个节点内。实际上，一个分片是一个 Lucene 索引，一个包含倒排索引的文件目录。==所以一个 ES 索引是由多个 Lucene 索引组成的。==

#### 倒排索引（reverted index）

这种结构适用于快速的全文搜索。为了创建倒排索引，我们首先要将每个文档拆分成独立的词（或称为词条或者 tokens），然后穿件一个包含所有不重复词条的排序列表，然后列出每个词条出现在哪个文档，相当于我们构建了一个以关键词为 key，以文档编号为 value 的 map。在进行关键词搜索的时候，就可以很快地把对应的文档结果返回而不用遍历每一个文档的内容。

## IK 分词器

IK 分词器是一个常用的开源中文分词器，Github [地址](https://github.com/medcl/elasticsearch-analysis-ik)

安装命令：

```shell
elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v8.6.2/elasticsearch-analysis-ik-8.6.2.zip
```

需要注意的一点是，安装的插件版本一定要和自己电脑中的 ES 版本一致。也可以手动在 Release 页面中下载，解压缩后放入 ES 目录中的 `plugins` 目录下，但由于某些历史版本已经找不到了，所以建议用 `elaseicsearch-plugin` 命令直接下载

使用 IK 分词器的例子如下，其中 `ik_smart` 为最少切分，`ik_max_word` 为最细粒度切分，穷尽词库的可能

![](/images/blog/elasticsearch/ik-example.png)

有时候可能分词结果不理想，我们可以自己对分词器的词典进行配置

## 查询

创建索引 / 插入数据

```
PUT /kuangshen/_doc/1
{
  "name": "狂神说",
  "age": 23,
  "desc": "一顿操作猛如虎，一看工资两千五",
  "tasgs": ["技术宅", "温暖", "直男"]
}
```

查询

```
GET kuangshen/_search
{
  "query": {
    "match": {
      "name": "狂神"
    }
  },
}
```

通过指定 `_source` 来自定义输出的 field

```
GET kuangshen/_search
{
  "query": {
    "match": {
      "name": "狂神"
    }
  },
  "_source": ["name", "desc"]
}
```

通过指定 `sort` 来进行排序

```
GET kuangshen/_search
{
  "query": {
    "match": {
      "name": "狂神"
    }
  },
  "sort": [
    {
      "age": {
        "order": "desc"
      }
    }
  ]
}
```

分页
通过指定 from 和 size 两个字段

```
GET kuangshen/_search
{
  "query": {
    "match": {
      "name": "狂神"
    }
  },
  "sort": [
    {
      "age": {
        "order": "desc"
      }
    }
  ],
  "from": 0,
  "size": 2
}
```

布尔值查询

- `must` 类似于 AND 条件连接，列表中的所有条件都要符合
- `should` 类似于 OR 条件，列表中的条件满足其一即可
- `must_not` 类似于 NOT 操作

```
GET kuangshen/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "name": "狂神说Java"
          }
        },
        {
          "match": {
            "age": 23
          }
        }
      ]
    }
  }
}
```

过滤器 filter

使用 filter 进行数据的过滤，可以添加多个条件。下面的例子中要求返回的结果必须是 `age` 字段的值大于等于 10 但小于等于 30

- gt 大于
- gte 大于等于
- lt 小于
- lte 小于等于

```
GET kuangshen/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "name": "狂神"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "age": {
              "gte": 10,
              "lte": 30
            }
          }
        }
      ]
    }
  }
}
```

多条件查询

多个条件可以使用空格隔开，只要满足其中一个结果即可以被查出

```
GET kuangshen/_search
{
  "query": {
    "match": {
      "tags": "男 技术"
    }
  }
}
```

精确查询

term 查询时直接通过倒排索引指定的词条进程精确查找的

关于分词：

- `term`，直接查询精确的
- `match`，使用分词器解析（先分析文档，然后再通过分析的文档进行查询）

两个类型：text 和 keyword

`keyword` 不会被分词器解析

示例如下：

当我们使用 standard analyzer 的时候，要搜索的字符串会被拆分，然后针对每一个 token 进行搜索

![](/images/blog/elasticsearch/standard-analyzer.png)

但当我们使用 keyword 的时候就不会被拆分，而是将其视为一个整体进行查询

![](/images/blog/elasticsearch/keyword-analyzer.png)

精确查询多个值

```
GET testdb/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "term": {
            "t1": 22
          }
        },
        {
          "term": {
            "t1": 33
          }
        }
      ]
    }
  }
}
```

高亮查询

```
GET kuangshen/_search
{
  "query": {
    "match": {
      "name": "狂神"
    }
  },
  "highlight": {
    "fields": {
      "name": {}
    }
  }
}
```

在选择的高亮字段前后加入了 `<em>` 标签

![](/images/blog/elasticsearch/highlight.png)

我们也可以自定义高亮样式：

```
GET kuangshen/_search
{
  "query": {
    "match": {
      "name": "狂神说"
    }
  },
  "highlight": {
    "pre_tags": "<p class='key' style='color:red'>",
    "post_tags": "</p>",
    "fields": {
      "name": {}
    }
  }
}
```

这样一来，查询结果的高亮字段前后就会从 `<em>` 变成我们自定义的 `<p>`
