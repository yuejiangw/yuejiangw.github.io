// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://yuejiangw.github.io',
	integrations: [
		starlight({
			title: 'Knowledge Base',
			social: {
				github: 'https://github.com/withastro/starlight',
			},
			sidebar: [
				{
					label: 'Java',
					autogenerate: { directory: 'java/' }
				},
				{
					label: 'Algorithm',
					items: [
						{
							label: 'LeetCode',
							autogenerate: { directory: 'algorithm/leetcode' },
						}
					]
				},
				{
					label: 'Database',
					items: [
						{
							label: 'MySQL',
							autogenerate: { directory: 'database/mysql' },
						},
						{
							label: 'MongoDB',
							autogenerate: { directory: 'database/mongo' },
						},
						{
							label: 'Redis',
							autogenerate: { directory: 'database/redis' },
						}
					]
				},
				{
					label: 'Rabbit MQ',
					autogenerate: { directory: 'rabbit-mq' },
				},
				{
					label: 'Elasticsearch',
					autogenerate: { directory: 'elasticsearch/' },
				},
				{
					label: 'System Design',
					items: [
						{
							label: '数据密集型应用',
							autogenerate: { directory: 'system-design/ddia' },
						}
					]
				},
				{
					label: 'Bug',
					autogenerate: { directory: 'bug/' },
				},
			],
		}),
	],
});
