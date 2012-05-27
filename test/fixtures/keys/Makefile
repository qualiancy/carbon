all: agent-cert.pem

clean:
	rm -f *.pem

agent-key.pem:
	openssl genrsa -out agent-key.pem 1024

agent-csr.pem: agent-key.pem agent.cnf
	openssl req -new -config agent.cnf -key agent-key.pem -out agent-csr.pem

agent-cert.pem: agent-csr.pem agent-key.pem
	openssl x509 -req \
		-days 999 \
		-in agent-csr.pem \
		-signkey agent-key.pem \
		-out agent-cert.pem

agent-verify: agent-cert.pem
	openssl verify -CAfile agent-cert.pem agent-cert.pem

test: agent-verify

.PHONY: all test clean
