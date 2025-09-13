FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install

# Install dos2unix to fix line endings
RUN apk add --no-cache dos2unix

COPY . .

# Convert line endings and make executable
RUN dos2unix start.sh
RUN chmod +x start.sh

EXPOSE 5000
CMD ["./start.sh"]