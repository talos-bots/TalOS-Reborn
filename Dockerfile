FROM node:21-alpine3.18
WORKDIR /usr/src/app
COPY . .
RUN apk update && apk add --no-cache cmake g++ make python3
RUN npm install -g typescript ts-node concurrently
RUN npm install
RUN npm run build-react
RUN cd server && npm install && npm run build
EXPOSE 3003
CMD ["npm", "run", "start-linux-server"]
