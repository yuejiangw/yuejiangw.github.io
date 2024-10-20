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
					autogenerate: { directory: 'algorithm/' },
				},
				{
					label: 'Database',
					items: [
						{
							label: 'MySQL',
							autogenerate: { directory: 'mysql/' },
						},
						{
							label: 'MongoDB',
							autogenerate: { directory: 'mongo/' },
						},
						{
							label: 'Redis',
							autogenerate: { directory: 'redis/' },
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
					autogenerate: { directory: 'system-design/' },
				},
				{
					label: 'Bug',
					autogenerate: { directory: 'bug/' },
				},
			],
		}),
	],
});
