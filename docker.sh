#!/bin/bash
echo cleaning up smart-sensor dockers
docker stop $(docker ps -a | grep smart-sensor | awk '{print $1}')
docker rm $(docker ps -a | grep smart-sensor | awk '{print $1}')

echo starting smart-sensor dockers
docker pull cosdev01.snapsinc.com:5000/collabornet/java
docker create -v /tmp --name smart-sensor-data collabornet/smart-sensor /bin/true
docker-compose -f docker-compose.yml -p fhir up -d