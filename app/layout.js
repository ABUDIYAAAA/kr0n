import './globals.css';

export const metadata = {
	title: 'kr0n — Developer Application Platform',
	description: 'Self-owned application deployment and orchestration platform',
};

export default function RootLayout({ children }) {
	return (
		<html
			lang='en'
			className='h-full antialiased dark'>
			<body className='min-h-full flex flex-col bg-[#0b0f17] text-slate-100'>
				{children}
			</body>
		</html>
	);
}
