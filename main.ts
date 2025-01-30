import { MongoClient, ObjectId } from "mongodb";
import { ApiPhone, Contact, ContactModel } from "./types.ts";
import { fromModelToContact } from "./utils.ts";


const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) throw new Error("Please provide a MONGO_URL")

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("Nebrija");

const ContactCollection= db.collection<ContactModel>("Contacts");


const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (method === "GET") {
    if(path === "/contacts"){
      const contactsDB = await ContactCollection.find().toArray()
      const contacts =  await Promise.all(contactsDB.map((contactDB) => fromModelToContact(contactDB)))
      return new Response(JSON.stringify(contacts), {status: 200})
    }
    if(path === "/contact"){
      const id = url.searchParams.get("id")
      if(!id) return new Response("Bad Request", {status: 409})
      const contactDB = await ContactCollection.findOne({_id: new ObjectId(id)})
      if(!contactDB) return new Response("User not found", {status: 404}) 
      const contact = await  fromModelToContact(contactDB)
      return new Response(JSON.stringify(contact))
    }
    
  } else if (method === "POST") {
    if(path === "/contact"){
      const contact:Contact = await req.json()
      const name = contact.name
      const phone = contact.phone
      if(!name && !phone) return new Response("Bad Request", {status:400})
      const contactExist = await ContactCollection.countDocuments({phone:phone})
      if(contactExist >=1) return new Response("Phone already exist")
      if(!contact.name && !contact.phone) return new Response("Bad Request", {status: 400})
      const API_KEY = Deno.env.get("API_KEY")
      if(!API_KEY) throw new Error("API KEY Not Provided")
      const api_url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`
      const data = await fetch(api_url, {headers: {"X-Api-Key":API_KEY}})
      if(data.status !== 200) throw new Error("APIPhone Nija Error")
      const response:ApiPhone = await data.json()
      const is_valid = response.is_valid
      if(!is_valid) return new Response("phone not valid", {status:409})
      const country = response.country
      const timezone = response.timezones[0]
      const {insertedId} = await ContactCollection.insertOne({
        name,
        phone,
        country,
        timezone
      })
      const newContact = {
        id: insertedId,
        name,
        phone,
        country,
        timezone,
      }
      return new Response(JSON.stringify(newContact), {status:200})
    }
  } else if (method === "PUT") {
    if(path === "/contact"){
      const contact:Contact = await req.json()
      if((!contact.id && !contact.name && !contact.phone) ||(contact.id && !contact.name && !contact.phone) ) return new Response("Bad Request", {status:400})
      if(!contact.phone){
        const newContact = await ContactCollection.findOneAndUpdate({_id: new ObjectId(contact.id)},{$set:{name:contact.name}})
        if(!newContact) return new Response("Cotact not found", {status:404})
        return new Response(JSON.stringify(newContact),{status:200})
      }
      if(!contact.name){
        const phone = contact.phone
        const contactExist = await ContactCollection.countDocuments({phone:phone})
        if(contactExist >=1) return new Response("Phone already exist")
        const API_KEY = Deno.env.get("API_KEY")
        if(!API_KEY) throw new Error("API KEY Not Provided")
        const api_url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`
        const data = await fetch(api_url, {headers: {"X-Api-Key":API_KEY}})
        if(data.status !== 200) throw new Error("APIPhone Nija Error")
        const response:ApiPhone = await data.json()
        const is_valid = response.is_valid
        if(!is_valid) return new Response("phone not valid", {status:409})
        const country = response.country
        const timezone = response.timezones[0]
        const newContact = await ContactCollection.findOneAndUpdate({_id: new ObjectId(contact.id)},{$set:{phone:contact.phone, country:country, timezone:timezone}})
        if(!newContact) return new Response("Cotact not found", {status:404})
        return new Response(JSON.stringify(newContact),{status:200})
      }
      const phone = contact.phone
      const contactExist = await ContactCollection.countDocuments({phone:phone})
      if(contactExist >=1) return new Response("Phone already exist")
      const API_KEY = Deno.env.get("API_KEY")
      if(!API_KEY) throw new Error("API KEY Not Provided")
      const api_url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`
      const data = await fetch(api_url, {headers: {"X-Api-Key":API_KEY}})
      if(data.status !== 200) throw new Error("APIPhone Nija Error")
      const response:ApiPhone = await data.json()
      const is_valid = response.is_valid
      if(!is_valid) return new Response("phone not valid", {status:409})
      const country = response.country
      const timezone = response.timezones[0]
      const newContact = await ContactCollection.findOneAndUpdate({_id: new ObjectId(contact.id)},{$set:{name: contact.name, phone:contact.phone, country:country, timezone:timezone}})
      if(!newContact) return new Response("Cotact not found", {status:404})
      return new Response(JSON.stringify(newContact),{status:200})
    }
  } else if (method === "DELETE") {
    if(path === "/contact"){
      const id = url.searchParams.get("id")
      if(!id) return new Response("Bad Request", {status: 400})
      const {deletedCount} = await ContactCollection.deleteOne({_id: new ObjectId(id)})
      if(deletedCount === 0){ 
        return new Response(JSON.stringify(false), {status: 404})
      }else{
        return new Response(JSON.stringify(true), {status: 200})
      }
    }
  }

  return new Response("endpoint not found", { status: 404 });
};

Deno.serve({ port: 3000 }, handler);
