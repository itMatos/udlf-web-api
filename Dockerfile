FROM --platform=linux/amd64 node:20-alpine

RUN apk add --no-cache bash

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Copy UDLF binary if it exists
COPY ./udlf /app/udlf

# Make UDLF executable
RUN chmod +x /app/udlf/bin/udlf

# Create necessary directories
RUN mkdir -p /app/outputs /app/uploads

# Set environment variables
ENV NODE_ENV=development

EXPOSE 8080

CMD ["npm", "run", "dev"]