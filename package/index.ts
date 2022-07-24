import {IsRestatement as IS} from "./indexx";
import {OptionsObject} from "./Processors/Pre"
import {MessageError} from "./Exceptions/messagError"

class IsRestatementResult {
    IsRestatement: boolean;
    Feedback: FeedbackItem[] = [];
}
class FeedbackItem {
    Issue: string;
    Priority: string;
}

function IsRestatement(Question: string, Response: string, Options: OptionsObject): IsRestatementResult {
    var Result: IsRestatementResult  = new IsRestatementResult();
    try {
        Result.IsRestatement = IS(Question,Response,Options) ?? false;
    } catch (e) {
        if(e.issues) {
            Result.IsRestatement = e.result;
            e.issues.forEach((element,index) => {
                var Item: FeedbackItem = new FeedbackItem();
                Item.Issue = element;
                Item.Priority = element.issueLevels[index];
                Result.Feedback.push(Item);
            });
        }
    }
    return Result;
}

export {OptionsObject, IsRestatement, IsRestatementResult, FeedbackItem}
export default {OptionsObject,IsRestatement, IsRestatementResult, FeedbackItem}