docker build -t davidsells/multi-client -t davidsells/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t davidsells/multi-server -t davidsells/multi-server  -f ./server/Dockerfile ./server
docker build -t davidsells/multi-worker -t davidsells/multi-worker  -f ./worker/Dockerfile ./worker

docker push davidsells/multi-client:latest
docker push davidsells/multi-server:latest
docker push davidsells/multi-worker:latest

docker push davidsells/multi-client:$SHA
docker push davidsells/multi-server:$SHA
docker push davidsells/multi-worker:$SHA

kubectl apply -f k8s

kubectl set image deployments/server-deployment server=davidsells/multi-server:$SHA
kubectl set image deployments/client-deployment client=davidsells/multi-client:$SHA
kubectl set image deployments/worker-deployment worker=davidsells/multi-worker:$SHA
