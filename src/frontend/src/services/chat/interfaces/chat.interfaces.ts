export interface CreateRes {
	chat_id: string
}

interface Message {
	sender: string
	message: string
	timestamp: string
}

export interface GetHistoryRes {
	history: Message[]
}

export interface SendMessageReq {
	message: string
}
