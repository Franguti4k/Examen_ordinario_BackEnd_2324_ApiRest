import { ApiTime, Contact, ContactModel } from "./types.ts";

export const fromModelToContact = async (contactDB: ContactModel):Promise<Contact> => {
    const time:string = await Time(contactDB)
    return{
        id: contactDB._id!.toString(),
        name: contactDB.name,
        phone: contactDB.phone,
        country: contactDB.country,
        timezone: contactDB.timezone,
        time: time
    }
}
export const Time = async (contactDB: ContactModel):Promise<string> => {

    const API_KEY = Deno.env.get("API_KEY")
    if(!API_KEY) throw new Error("API KEY Not Provided")
    const timezone = contactDB.timezone
    const url = `https://api.api-ninjas.com/v1/worldtime?timezone=${timezone}`
    const data = await fetch(url, {headers: {"X-Api-Key": API_KEY}})
    if(data.status !== 200) throw new Error("APITime Ninja Error")
    const response:ApiTime = await data.json()
    
    return response.datetime
}
