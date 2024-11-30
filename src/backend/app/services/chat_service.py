import asyncio
import logging
import uuid
from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.clients.text_model_client import TextModelClient
from app.repositories.chat_repository import ChatHistoryRepository
from app.models import ChatEvent, History
from app.repositories.websocket_repository import WebSocketRepository


class ChatService:
    def __init__(
            self,
            chat_history_repository: ChatHistoryRepository,
            websocket_repository: WebSocketRepository,
            scheduler: AsyncIOScheduler,
            text_model_client: TextModelClient
    ):
        self.chat_history_repository = chat_history_repository
        self.websocket_repository = websocket_repository
        self.scheduler = scheduler
        self.text_model_client = text_model_client

    async def create_chat(self) -> str:
        chat_id = str(uuid.uuid4())
        await self.chat_history_repository.create_chat(chat_id)
        logging.info(f"Создан чат {chat_id}")
        return chat_id

    async def check_chat_exists(self, chat_id: str) -> bool:
        return await self.chat_history_repository.check_chat_exists(chat_id)

    async def get_chat_history(self, chat_id: str) -> History:
        return await self.chat_history_repository.get_history(chat_id)

    async def add_task_for_generate(self, chat_id: str, message: str):
        await self.chat_history_repository.add_message(chat_id, "user", message)

        await self.websocket_repository.send_message(chat_id, ChatEvent(status="generating", message=None, timestamp=datetime.utcnow()))

        self.scheduler.add_job(
            id=f"chat_id:{chat_id}",
            func=self.process_generate,
            trigger='date',
            run_date=datetime.utcnow() + timedelta(seconds=5),
            args=[chat_id]
        )

    async def process_generate(self, chat_id: str):
        history = await self.chat_history_repository.get_history(chat_id)

        last_message = max(history.history, key=lambda msg: msg.timestamp)

        history_messages = sorted(history.history, key=lambda msg: msg.timestamp)
        print(history_messages)
        history_str = "\n".join(f"{msg.sender}: {msg.message}" for msg in history_messages)

        answer = await self.text_model_client.get_answer(last_message.message, history_str)

        await self.chat_history_repository.add_message(chat_id, "llm", answer)

        await self.websocket_repository.send_message(chat_id, ChatEvent(status="generated", message=answer,
                                                                        timestamp=datetime.utcnow()))
