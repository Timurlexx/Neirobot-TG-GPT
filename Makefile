build:
	docker build -t neirobot .

run:
	docker run -d -p 3000:3000 --name neirobot --rm neirobot