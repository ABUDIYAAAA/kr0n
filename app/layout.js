import './globals.css';
import { Public_Sans, JetBrains_Mono } from 'next/font/google';

const publicSans = Public_Sans({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	variable: '--font-sans',
	display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ['latin'],
	weight: ['400', '500', '600'],
	variable: '--font-mono',
	display: 'swap',
});

export const metadata = {
	title: 'kr0n — Application platform for engineering teams',
	description:
		'Connect GitHub repositories, map monorepos, tune build settings, and run teams with role-based access from one control plane.',
	openGraph: {
		title: 'kr0n — Application platform for engineering teams',
		description:
			'Connect GitHub repositories, map monorepos, tune build settings, and run teams with role-based access from one control plane.',
		siteName: 'kr0n',
		type: 'website',
	},
};

export default function RootLayout({ children }) {
	return (
		<html lang='en' className={`${publicSans.variable} ${jetbrainsMono.variable}`}>
			<body>{children}</body>
		</html>
	);
}
