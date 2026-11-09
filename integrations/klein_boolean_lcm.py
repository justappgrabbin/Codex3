"""Lossless bridge from the ORIGINAL language-contact-model core to six-bit Swarm state.

Install the user's language-contact-model checkout on PYTHONPATH. No weights or
Klein semantic interpretation are fabricated. Requires no third-party packages.
"""
from dataclasses import dataclass
from fractions import Fraction
from copy import deepcopy

@dataclass(frozen=True)
class BooleanReading:
    bits: tuple
    reading: dict
    position: dict
    bit_role: str = "gate-address"
    @property
    def value(self):
        return sum(bit << (5-i) for i, bit in enumerate(self.bits))
    def export(self):
        return {"schema":"klein-boolean-lcm/v1","bits":list(self.bits),
                "reading":deepcopy(self.reading),"position":deepcopy(self.position),
                "bit_role":self.bit_role}

def from_value(value, reading, position, bit_role):
    if type(value) is not int or not 0 <= value < 64:
        raise ValueError("Six-bit address must be an integer 0..63")
    if not isinstance(reading,dict) or not reading.get("context_id") or not reading.get("source_tool"):
        raise ValueError("Source-grounded reading and context required")
    if not isinstance(position,dict) or not position or not bit_role:
        raise ValueError("Explicit position and bit role required")
    return BooleanReading(tuple((value >> (5-i)) & 1 for i in range(6)),
                          deepcopy(reading),deepcopy(position),bit_role)

def positional_reading(turn_position, *, context_id, source_id):
    """Use the original LCM's exact positional subdivisions, not a new mapping.

    This represents a gate ADDRESS, not a HEXAGRAM or an inferred meaning.
    """
    from core import HD, SEXAGESIMAL, subdivide
    if not context_id or not source_id:
        raise ValueError("Context and source evidence required")
    p=Fraction(turn_position)
    if not 0 <= p < 1:
        raise ValueError("Position must be in [0,1) turns")
    hd=subdivide(p,HD)
    sex=subdivide(p,SEXAGESIMAL)
    address={name:index for name,index,_ in hd}
    angular={name:index for name,index,_ in sex}
    reading={"kind":"semantic","context_id":context_id,
             "source_tool":"language-contact-model/core.subdivide",
             "nodes":[{"kind":name,"index":index,"arcseconds_per_cell":str(size)}
                      for name,index,size in hd],
             "relations":[{"kind":"contains","parent":hd[i][0],"child":hd[i+1][0]}
                          for i in range(len(hd)-1)],
             "evidence":[source_id],
             "payload":{"position_turns":str(p),"hd_address":address,
                        "sexagesimal_address":angular,"interpretation":"positional-only"}}
    return from_value(address["Gate"]-1,reading,
                      {"turns":str(p),"address":address,"angular":angular},"gate-address")

def compose(left,right,operator,*,relation):
    """Boolean operation only. The original Klein resolver must interpret it."""
    if not isinstance(relation,dict) or not relation:
        raise ValueError("Explicit relation required")
    if left.reading["context_id"] != right.reading["context_id"] and not relation.get("cross_context"):
        raise ValueError("Cross-context declaration required")
    ops={"AND":lambda a,b:a&b,"OR":lambda a,b:a|b,"XOR":lambda a,b:a^b,
         "NAND":lambda a,b:1-(a&b),"NOR":lambda a,b:1-(a|b),"XNOR":lambda a,b:1-(a^b)}
    if operator not in ops:
        raise ValueError("Unsupported Boolean operation")
    bits=tuple(ops[operator](a,b) for a,b in zip(left.bits,right.bits))
    return {"schema":"klein-boolean-composition/v1","bits":list(bits),
            "relation":deepcopy(relation),"left":left.export(),"right":right.export(),
            "interpretation_status":"unresolved"}

def resolve(composition, klein_resolver):
    """Only a caller-provided real Klein resolver can produce interpreted output."""
    if composition.get("schema")!="klein-boolean-composition/v1":
        raise ValueError("Invalid composition")
    if not callable(klein_resolver):
        raise TypeError("Original Klein resolver required")
    result=klein_resolver(deepcopy(composition))
    if not isinstance(result,dict) or not result.get("source_tool") or not result.get("context_id"):
        raise TypeError("Resolver must return a sourced Klein reading")
    return result
