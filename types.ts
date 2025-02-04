import {OptionalId} from "mongodb"
 
export type ContactModel = OptionalId <{
    name:string,
    phone:string,
    country:string,
    timezone:string,
}>

export type Contact = {
    id:string,
    name:string,
    phone:string,
    country:string,
    timezone:string,
    time: string
}

export type ApiPhone = {
    is_valid: boolean,
    country: string,
    timezones: string[]
}

export type ApiTime = {
    datetime: string
}
