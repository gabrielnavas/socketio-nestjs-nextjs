'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string
  nameFrom: string
  nameTo: string
  text: string
  isPrivate: boolean
}

const socket = io('http://localhost:3333');

export default function Home() {
  const [title] = useState('Chat Web')
  const [messages, setMessages] = useState<Message[]>([])

  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [personNameSelected, setPersonNameSelected] = useState('')

  const [persons, setPersons] = useState<string[]>([])
  const [online, setOnline] = useState(false)

  const [countOnline, setCountOnline] = useState(0)

  function receivedMessage(newMessage: Message) {
    setMessages(prev => [...prev, newMessage])
  }

  useEffect(() => {
    socket.on('connect', () => {
    })

    socket.on('messageToAll', (payload: Message) => {
      receivedMessage(payload)
    })

    socket.on('messageTo', (payload: Message) => {
      debugger
      receivedMessage(payload);
    })

    socket.on('countOnline', (count: number) => {
      setCountOnline(count)
    })

    socket.on('addPersons', (personNames: string[]) => {
      setPersons(prev => [...new Set([...prev].concat(personNames))])
    })

    socket.on('enableOnline', () => {
      setOnline(true)
    })

    socket.on('removePerson', (name: string) => {
      setPersons(prev => [...prev].filter(person => person !== name))
    })

    return () => {
      disconnect()
      console.log('disconnected');
    }
  }, [])

  function connect() {
    if (validateName()) {
      socket.connect()
      socket.emit('connectName', name)
    }
  }

  function disconnect() {
    socket.disconnect()
    setOnline(false)
  }


  function validateName() {
    return name.length > 0
  }

  function validateInput() {
    return text.length > 0
  }

  function sendMessage() {
    if (validateInput()) {
      const message: Message = {
        nameFrom: name,
        nameTo: '',
        text,
        id: uuidv4(),
        isPrivate: false
      }

      if (personNameSelected) {
        message.isPrivate = true
        message.nameTo = personNameSelected
        socket.emit('messageTo', message)
        receivedMessage(message)
      } else {
        socket.emit('messageToAll', message);
      }
      setText('')
    }
  }

  return (
    <Card className="flex">
      <CardHeader>
        <div className="flex gap-2 items-start">
          {title}
        </div>
        <div className="flex gap-4">
          {countOnline} pessoas online
        </div>
        <ScrollArea className="flex flex-col h-72 w-36 rounded-md border">
          {persons.filter(person => person !== name).map(person =>
            <Button className="w-full" key={person} onClick={() => setPersonNameSelected(person)}>
              <div className="flex gap-2 text-green">
                {person}
              </div>
            </Button>
          )}
        </ScrollArea>
      </CardHeader>
      <CardContent className="flex flex-col w-full">
        <div className="flex gap-4">
          <Input
            disabled={online}
            value={name}
            onChange={v => setName(v.target.value)}
            placeholder="Digite seu nome" />
          <Button onClick={() => online ? disconnect() : connect()}>
            {online
              ? 'Desconectar'
              : 'Conectar'}
            <Online online={online} />
          </Button>
        </div>
        <ScrollArea className="h-72 w-full rounded-md border">
          {
            messages.map(message => (
              message.nameFrom === name
                ? (
                  <div key={message.id}>
                    {message.isPrivate
                      ? (
                        <div>
                          <strong>Você </strong>
                          disse no privado para {' '}
                          <strong>
                            {message.nameTo}
                          </strong>: {' '}
                          {message.text}
                        </div>
                      ) : (
                        <div>Você disse: {message.text}</div>
                      )}
                  </div>
                ) : (
                  <div key={message.id}>
                    {message.isPrivate
                      ? (
                        <div>
                          <strong>{message.nameFrom}</strong>
                          te enviou no privado: {' '}
                          <strong>
                            {message.text}

                          </strong>
                        </div>
                      ) : (
                        <div>
                          <strong>{message.nameFrom}
                          </strong> disse:{' '}
                          <strong>{message.text}</strong>
                        </div>
                      )}
                  </div>
                )

            ))
          }
        </ScrollArea>
        <CardFooter className="flex justify-center w-full">
          <label>Para {personNameSelected
            ? <div className="flex">
              <span className="text-gray-900 font-semibold">{personNameSelected}</span>
              <Button variant='secondary' onClick={() => setPersonNameSelected('')}>Cancelar</Button>
            </div> : 'Todos'}</label>
          <Input
            value={text}
            onChange={v => setText(v.target.value)}
            placeholder="Digite sua mensagem" />
          <Button onClick={() => sendMessage()}>Enviar</Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

const Online = ({ online }: { online: boolean }) => (
  <div className="p-1">
    {online
      ? <div className="bg-green-600 w-2 h-2 rounded-full" />
      : <div className="rounded-full bg-red-600 w-2 h-2" />}
  </div>
)
