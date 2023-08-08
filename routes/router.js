const debug = require('debug')('hackthethon:routes')
const apiRoutes = require('./api')

module.exports = initRoutes = (app) => {
	debug('Initializing routes...')

	app.use('/api', apiRoutes)
    
	debug('Finished initializing routes...')
}
