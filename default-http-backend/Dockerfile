FROM golang:1.16-buster as build

WORKDIR /go/src/app
ADD . /go/src/app
RUN go build -o /go/bin/default-http-backend

FROM gcr.io/distroless/base-debian10
LABEL org.opencontainers.iamge.authors="secure@brickdoc.com"
LABEL org.opencontainers.image.source = "https://github.com/brickdoc/app-engine"
COPY --from=build /go/bin/default-http-backend /
ADD index.html /
CMD ["/default-http-backend"]