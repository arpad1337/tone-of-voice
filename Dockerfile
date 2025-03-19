ARG CI

FROM node:20-alpine

ARG CI

ENV CI_COMMIT_SHORT_SHA="PRODUCTION__MOCK__CI_COMMIT_SHORT_SHA"

ENV NODE_ENV="production"
ENV PORT=8200

RUN apk update \
  && apk add wget

WORKDIR /usr/src/app

COPY package*.json tsconfig.json install-runners.dev.sh ./

RUN npm install

COPY ./static ./static

COPY ./src ./src

# Dependency audit
RUN npm audit

# Building assets
RUN npm run build 

RUN rm -fr ./src

# compilation test:
RUN npm start

EXPOSE 8200

CMD [ "npm", "start" ]