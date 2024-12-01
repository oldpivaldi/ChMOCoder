export interface CreateRes {
	chat_id: string
}

export interface Message {
	sender: 'user' | 'llm'
	message: string
	timestamp: string
}

export interface GetHistoryRes {
	history: Message[]
}

export interface SendMessageReq {
	message: string
}

export enum StatusMessage {
	GENERATING = 'generating',
	GENERATED = 'generated',
}

export interface SocketMessage {
	status: StatusMessage
	message: string
	timestamp: string
}