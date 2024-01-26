import { NextApiResponseServerIO } from "@/lib/types"
import { Server as NetServer } from "http"
import { NextApiRequest } from "next"
import { Server as ServerIO } from "socket.io"

export const config = {
    api: {
        body: false
    }
}

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
    if (!res.socket.server.io) {
        const path = '/api/socket/io'
        const httpServer: NetServer = res.socket.server as any
        const io = new ServerIO(httpServer, {
            path: path,
            addTrailingSlash: false
        })
        // CREATE SOCKET CONNECTION
        io.on('connection', (s) => {
            // CONNECT USER TO ROOM
            s.on('create-room', (fileId) => {
                s.join(fileId)
            })

            s.on('send-changes', (deltas, fileId) => {
               s.to(fileId).emit('receive-changes', deltas, fileId)
            })

            s.on('send-cursor-move', (range, fileId, cursorId) => {
               s.to(fileId).emit('receive-cursor-move', range, fileId, cursorId)
            })
        })

        res.socket.server.io = io
    }

    res.end()
}

export default ioHandler