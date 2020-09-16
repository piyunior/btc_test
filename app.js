const config = require('./config.js')
const express = require('express')
const bodyParser = require('body-parser');
const morgan = require('morgan')
const axios = require('axios').default

const app = express();

app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// modifications to the response's http header
app.use(function (request, response, next) {
    response.header('Access-Control-Allow-Origin', "*")
    response.removeHeader('X-Powered-By')
    response.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization")
    response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    next()
})

app.get('/information', async (req, res, next) => {
    let arrAux = [];
    let arrNational = [
        {
            name: 'PTR',
            price: `${config.PTR} $`
        },
        {
            name: 'BSF',
            price: `${config.BS} $`
        }
    ]
    try {
        for (const i in config.ARR_TYPE) {
            let objAux;
            try {
                let coins = (await axios.get(config.ALTERNATIVE_URL + config.ARR_TYPE[i])).data;
                objAux = {
                    name: config.ARR_TYPE[i],
                    price: `${coins[config.ARR_TYPE[i]].quotes.USD.price.toFixed(2)} $`
                }
            } catch (error) {
                throw error;
            }
            arrAux.push(objAux)
        };
        const arr = Array().concat(arrNational, arrAux)
        res.status(200).json({
            status: 'Ok',
            documents: arr
        })
    } catch (error) {
        res.status(400).json({
            status: 'Fail',
            document: []
        })
    }

})

app.post('/calculate/prices', async (req, res, next) => {
    let arrAux = [];
    let coins = (await axios.get(config.ALTERNATIVE_URL + req.body.coin)).data;
    let base = {
        amount: req.body.amount,
        coin: req.body.coin,
        price: coins[req.body.coin].quotes.USD.price
    };
    let arrNational = [
        {
            name: 'PTR',
            price: `${base.price / config.PTR } PTR`
        },
        {
            name: 'BSF',
            price: `${ base.price / config.BS_VALUE} BSF`
        }
    ]
    let arrType = config.ARR_TYPE.filter(function (x) {
        if (x != base.coin) {
            return x
        }
    });

    try {
        for (const i in arrType) {
            let objAux;
            try {
                let coins = (await axios.get(config.ALTERNATIVE_URL + arrType[i])).data;
                let price = base.price / coins[arrType[i]].quotes.USD.price;
                objAux = {
                    name: arrType[i],
                    price: `${price.toFixed(2)} ${base.coin}`
                }
            } catch (error) {
                throw error;
            }
            arrAux.push(objAux)
        };
        const arr = Array().concat(arrNational, arrAux)
        base.result = arr;
        res.status(200).json({
            status: 'Ok',
            documents: base
        })
    } catch (error) {
        res.status(400).json({
            status: 'Fail',
            document: []
        })
    }
})

app.listen(3000, () => {
    console.log('The server is started')
})