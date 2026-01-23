import pymongo
import numpy as np
import faiss

# Connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['dev_digitaltrainingcompanion']
#collection = db['embedding-rcnum-obligatoire']
#collection = db['embedding-rcnum-postobligatoire']
#collection = db['embedding-digcompedu']
#collection = db['embedding-pernum']
#collection = db['embedding-esco']
#collection = db['embedding-digcomp']
#collection = db['embedding-lehrplan-mi']
#collection = db['embedding-rcpfpee']
#collection = db['embedding-rcpmpe']
#collection = db['embedding-crcnedu']
collection = db['embedding-cpllcd']

print(collection)

# Fetch the embeddings
embeddings = []
for doc in collection.find():
    embeddings.append(doc['embedding'])

# Convert the list of embeddings to a 2D numpy array
embeddings_array = np.array(embeddings).astype('float32')

# Create a FAISS index
dimension = embeddings_array.shape[1]
index = faiss.IndexFlatL2(dimension)

# Add embeddings to the index
index.add(embeddings_array)

# Save the index to disk
faiss.write_index(index, 'faiss_index_cpllcd')
