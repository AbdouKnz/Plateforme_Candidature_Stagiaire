package main

import (
	"astro-backend/config"
	"astro-backend/db"
	"astro-backend/router"

	"github.com/rs/zerolog/log"
)

func init() {
	// Load config
	config.LoadConfig()

	// Init Logger
	config.InitLogger()
}

// @title						Astro - Backend
// @version					1.0.0
// @BasePath					/
// @securityDefinitions.apikey	Bearer
// @in							header
// @name						Authorization
// @description				Type "Bearer" followed by a space and JWT token.
func main() {
	log.Info().Msg(`   
				  ..                                                                                                                  
   				 *///.                 
                ((((((((*               
               /(((((((#/               
                /((#####*               
    .((*     (%%  /#######/.    /((/    
  (%%%%%%%%%%%%#     .*/(/,  ##%%%%%%%. 
  %%%%%%%%%%%%/            (%%%%%%%%%%( 
  .%%%%%%%%%              *%%%%%%%%%%%  		ASTEROIDEA © 2026 ALL RIGHTS RESERVED
          .               *%%%*         		  
           ....            (%*          
           ..,,,       ,*/*.            
         .,,,,,,,  .//((((((((((*       
       ,,,,,,,,,,       ((((######      
       .,,,,,,,,.        #########      
         .,,,,.           /#####,                                     
	`)

	log.Info().Msg(`
		╔═════════════════════════════════════════════════════════╗
		        	Astro - Backend SERVICE 	     	  	  
		            	   PROJECT INITIALIZATION         		             
		╚═════════════════════════════════════════════════════════╝
	`)

	log.Info().Msg("----------------------- # STARTING Astro BACKEND SERVER - DEV # -----------------------")

	// Initialize database
	dbInstance, err := db.DatabaseManager()
	if err != nil {
		log.Error().Msg("Failed to connect to database: " + err.Error())
		return
	}
	defer dbInstance.Close()

	// init router
	router.RouterManager(dbInstance)
}
