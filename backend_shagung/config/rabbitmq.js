import amqplib from "amqplib"; // ✅ correct


let channel;
export const connectEmailService = async()=>{
    try{
             const connection = await amqplib.connect(process.env.RABBITMQ_URL);
             channel = await connection.createChannel();
             await channel.assertQueue('emailQueue',{durable:true});
             console.log("Email Service connected to RabbitMQ");
    }
    catch(err){
           console.log("Email Service connection error to RabbitMQ",err);
    }

}


export const getChannel = ()=>channel;
