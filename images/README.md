## Building the image

```bash
docker build -t helloworld:latest .
```

## Running the image

```bash
docker run -p 3000:80 -t helloworld:latest
```

## Testing the image

Once it's running, visit [http://localhost:3000/](http://localhost:3000/) in your browser.
