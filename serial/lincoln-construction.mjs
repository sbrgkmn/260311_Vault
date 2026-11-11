// Normalized topology of the supplied Lincoln red/green markup, not a survey fit.
export function lincolnPattern(){
  const upper=[60,75],lower=[40,75],line=(a,b)=>({a,b,structural:true});
  return {
    upper,lower,
    primary:[line([0,0],upper),line([100,0],upper),line([0,150],lower),line([100,150],lower)],
    secondary:[line([0,0],lower),line([60,0],upper),line([100,150],upper),line([40,150],lower)],
    guide:line([0,75],[100,75]),
  };
}
