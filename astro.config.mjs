// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	vite: {
		resolve: {
			alias: {
				'@components': '/src/components',
			}
		}
	},
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
					label: 'LeetCode',
					autogenerate: { directory: 'leetcode/' }
				},
				{
					label: 'Database',
					autogenerate: { directory: 'database/' }
				},
				{
					label: 'Message Broker',
					autogenerate: { directory: 'message-broker' },
				},
				{
					label: 'Frontend',
					autogenerate: { directory: 'frontend/' },
				},
				{
					label: 'System Design',
					autogenerate: { directory: 'system-design' },
				},
				{
					label: 'Bug',
					autogenerate: { directory: 'bug/' },
				},
			],
		}),
	],
});
