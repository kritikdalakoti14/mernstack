const mongoose=require('mongoose')


const postSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,  //here we are relating the user schema with the post schema meaning that here 
//  the user id would be stored of the user whose posts are in this schema.  
        ref:'User'
    },
    location:{
        type:String
    },
    avatar:{
        type:String
    },
    text:{
        type:String
    },
    likes:[{
        user:{
            type:mongoose.Schema.Types.ObjectId, // here also likes is an array of object id's so that if we want to see who 
//has liked the post one can go directly to his/her profile by clicking only.
            ref:'User' // array.length would give no of likes
        }
    }],
    comment:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        date:{
            type:Date,
            default:Date.now
        }
    }],
    date:{
        type:Date,
        default:Date.now
    }
})


module.exports = mongoose.model("Post",postSchema);