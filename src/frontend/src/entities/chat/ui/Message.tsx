import { FC, lazy, Suspense, useMemo, useState } from 'react'
import { Bot, User, Copy, Check } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import {
	oneDark,
	oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
	Alert,
	AlertTitle,
	AlertDescription,
	Button,
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	Skeleton,
	useTheme,
} from '@/shared/ui'
import { filterText } from '../lib'
import { Sender } from '../model'
const SyntaxHighlighter = lazy(
	() => import('react-syntax-highlighter/dist/cjs/prism')
)
const Markdown = lazy(() => import('react-markdown'))

interface MessageProps {
	author: Sender
	description: string
}

const Message: FC<MessageProps> = ({ author, description }) => {
	const [copied, setCopied] = useState(false)
	const [timerId, setTimerId] = useState<NodeJS.Timeout | undefined>()

	const theme = useTheme()

	const codeTheme = theme.theme === 'light' ? oneLight : oneDark

	const handleCopyText = () => {
		navigator.clipboard.writeText(description)
		setCopied(true)

		clearTimeout(timerId)

		const id = setTimeout(() => setCopied(false), 1000)

		setTimerId(id)
	}

	const filteredText = useMemo(() => filterText(description), [description])

	return (
		<Alert className='w-2/5'>
			{author === 'user' ? (
				<User className='h-4 w-4' />
			) : (
				<Bot className='h-4 w-4' />
			)}
			<AlertTitle className='capitalize'>{author}</AlertTitle>
			<AlertDescription>
				<Suspense fallback={<Skeleton className='w-full h-5' />}>
					<Markdown
						children={filteredText}
						remarkPlugins={[remarkGfm]}
						components={{
							code({ className, children, ...rest }) {
								const match = /language-(\w+)/.exec(className || '')

								return match ? (
									<SyntaxHighlighter
										PreTag='div'
										children={String(children).replace(/\n$/, '')}
										language={match[1]}
										style={codeTheme}
									/>
								) : (
									<code {...rest} className={className}>
										{children}
									</code>
								)
							},
						}}
					/>
				</Suspense>
			</AlertDescription>
			<div className='mt-1'>
				<TooltipProvider>
					<Tooltip delayDuration={0} open={copied}>
						<TooltipTrigger asChild>
							<Button
								variant={'ghost'}
								size={'icon'}
								className='h-6 w-6'
								onClick={handleCopyText}
							>
								{copied ? <Check /> : <Copy />}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Copied!</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</Alert>
	)
}

export default Message
