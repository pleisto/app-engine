package main

import (
	"flag"
	"log"

	"github.com/valyala/fasthttp"
	// "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	addr = flag.String("addr", "0.0.0.0:3000", "TCP address to listen to")
)

func main() {
	const API_CONTENT_TYPE = "application/vnd.brickdoc.app-engine+json; charset=utf8"
	flag.Parse()

	// Setup Fasthttp file server handler

	fs := &fasthttp.FS{
		Root:               "./",
		IndexNames:         []string{"index.html"},
		GenerateIndexPages: false,
		// Gzip and brotil compress by ingress or load balancing.
		Compress:        false,
		AcceptByteRange: true,
	}

	fs.PathRewrite = spaPathRewrite()

	fsHandler := fs.NewRequestHandler()

	requestHandler := func(ctx *fasthttp.RequestCtx) {

		if string(ctx.Path()) == "/healthz" {
			ctx.SetContentType(API_CONTENT_TYPE)
			ctx.SetBodyString("{\"alive\": true}")
			ctx.SetStatusCode(fasthttp.StatusOK)
			return
		}
		fsHandler(ctx)
		ctx.SetStatusCode(fasthttp.StatusNotFound)
	}

	// Start server.
	if len(*addr) > 0 {
		log.Printf("Starting HTTP server on %q", *addr)
		go func() {
			if err := fasthttp.ListenAndServe(*addr, requestHandler); err != nil {
				log.Fatalf("error in ListenAndServe: %s", err)
			}
		}()
	}

	log.Printf("See stats at http://%s/healthz", *addr)

	// Wait forever./
	select {}
}

func spaPathRewrite() fasthttp.PathRewriteFunc {
	return func(ctx *fasthttp.RequestCtx) []byte {
		return []byte("/index.html")
	}
}

func contains(arr []byte, byt byte) bool {
	for _, a := range arr {
		if a == byt {
			return true
		}
	}
	return false
}
