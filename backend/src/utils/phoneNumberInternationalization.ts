import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
/* Returns object as
{
    isValid: true|false
    number:String => if valid is international else just number given
}  */
// [number,number] , US
const checkValidationAndReturnInternationalized = (
  phoneNumbers: string[],
  countryIsoAlpha: any
) =>
  phoneNumbers.map((number) => {
    const isValid = isValidPhoneNumber(number, countryIsoAlpha);
    return {
      isValid,
      number: parsePhoneNumber(number, countryIsoAlpha),
    };
  });

module.exports = { checkValidationAndReturnInternationalized };
