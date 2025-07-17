// backend/elasticsearch.js
import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: 'http://localhost:9200' // Change this if your Docker host is different
});

export default client;
