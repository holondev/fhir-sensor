package io.collabornet.smart.sensor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@Slf4j
public class Application 
{
    public static void main( String[] args )
    {
        SpringApplication app = new SpringApplication(Application.class);
        app.run(args);
        Runtime.getRuntime().addShutdownHook(new Thread() {

			@Override
			public void run() {
				log.info("Shutting down");
			}
        	
        });
    }
}
