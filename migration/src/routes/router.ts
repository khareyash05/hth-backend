const apiRoutes = require('./api')
const debug = require('debug')('hackthethon:routes')

export function initRoutes(app) {
	debug('Initializing routes...')

	app.use('/api', apiRoutes)
    
	debug('Finished initializing routes...')
}
