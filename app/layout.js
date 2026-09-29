import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-sans',
	display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ['latin'],
	variable: '--font-mono',
	display: 'swap',
});

export const metadata = {
	title: 'kr0n — Deploy. Operate. Observe.',
	description:
		'Deploy and operate your applications without managing clusters, infrastructure, or deployment machinery.',
	openGraph: {
		title: 'kr0n — Deploy. Operate. Observe.',
		description:
			'Deploy and operate your applications without managing clusters, infrastructure, or deployment machinery.',
		siteName: 'kr0n',
		type: 'website',
	},
};

export default function RootLayout({ children }) {
	return (
		<html lang='en' className={`${inter.variable} ${jetbrainsMono.variable}`}>
			<body>{children}</body>
		</html>
	);
}
