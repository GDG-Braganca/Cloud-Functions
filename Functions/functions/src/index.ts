// Importando dependências
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as bodyParser from 'body-parser'

// Inicialização do Firebase e suas configurações padrões
admin.initializeApp(functions.config().firebase)

// Inicialização do servidor Express.js
const app = express()
const main = express()

// Definição do caminho das requisições e json
main.use('/api/v1.0', app)
main.use(bodyParser.json())
main.use(bodyParser.urlencoded({extended: false}))

// Inicialização do banco de dados
const db = admin.firestore()
const userCollection = 'users'

// Definição do nome do Cloud Function
export const webApi = functions.https.onRequest(main)
const usersEndpoint = '/users'

// Interface User
interface User {
    name: String,
    age: number,
    nationality: String
}

// Requisições HTTP
// POST - Criar novo User
app.post(usersEndpoint, async(req, res) => {
    try {
        const user: User = {
            name: req.body['name'],
            age: req.body['age'],
            nationality: req.body['nationality']
        }

        const newUserDoc = await db
            .collection(userCollection)
            .add(user)
        
        res.status(201)
            .json({
                message: 'A new User has been created',
                id: newUserDoc.id
            })
    } catch (error) {
        res.status(400).json({message: 'User did not created. Please, check all data.'})
    }
})

// GET - Obter todos os Users
app.get(usersEndpoint, async(req, res) => {
    try {
        const userSnapshot = await db.collection(userCollection).get()
        const users: any[] = []

        userSnapshot.forEach((userDocument) => {
            users.push(
                {
                    id: userDocument.id,
                    data: userDocument.data()
                }
            )
        })

        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({message: error})
    }
})

// GET - Obter User com id
app.get(usersEndpoint + '/:userId', async(req, res) => {
    const userId = req.params.userId
    db.collection(userCollection)
        .doc(userId)
        .get()
        .then(user => {
            if (!user.exists) {
                throw new Error()
            }

            res.status(200).json({
                id: user.id,
                data: user.data()
            })
        })
        .catch(error => {
            res.status(404).json({message: 'User with id ' + userId + ' not found'})
        })
})

// PUT - Atualizar um User
app.put(usersEndpoint + '/:userId', async(req, res) => {
    const userId = req.params.userId

    await db.collection(userCollection)
        .doc(userId)
        .set(req.body, {merge: true})
        .then(() => {
            res.status(204).send()
        })
        .catch(error => {
            res.status(500).json({message: error})
        })
})

// Delete - Remover um User
app.delete(usersEndpoint + '/:userId', async(req, res) => {
    const userId = req.params.userId

    db.collection(userCollection)
        .doc(userId)
        .delete()
        .then(() => {
            res.status(204).send()
        })
        .catch(error => {
            res.status(500).json({message: error})
        })
})