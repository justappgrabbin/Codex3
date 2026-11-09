"""Integration contract tests. For real LCM test, set PYTHONPATH to LCM checkout."""
import sys
import types
import unittest
from fractions import Fraction
from unittest.mock import patch
from integrations.klein_boolean_lcm import positional_reading, compose, resolve

class TestKleinBooleanLCM(unittest.TestCase):
    def setUp(self):
        # Contract fixture only; original LCM is exercised separately.
        core=types.ModuleType("core")
        core.HD=[("Gate",64),("Line",6),("Color",6),("Tone",6),("Base",5)]
        core.SEXAGESIMAL=[("Degree",360),("Minute",60),("Second",60)]
        def subdivide(p,levels):
            x=p; size=Fraction(1296000); result=[]
            for name,n in levels:
                size/=n
                i=int(x*n)
                result.append((name,i+1,size))
                x=x*n-i
            return result
        core.subdivide=subdivide
        self.patch=patch.dict(sys.modules,{"core":core})
        self.patch.start()
    def tearDown(self):
        self.patch.stop()
    def test_all_64_addresses_roundtrip(self):
        for n in range(64):
            word=positional_reading(Fraction(n,64),context_id="world-1",source_id="test-source")
            self.assertEqual(word.value,n)
            self.assertEqual(word.reading["payload"]["hd_address"]["Gate"],n+1)
            self.assertEqual(word.reading["evidence"],["test-source"])
            self.assertEqual(len(word.reading["relations"]),4)
    def test_composition_unresolved(self):
        a=positional_reading("0",context_id="world-1",source_id="a")
        b=positional_reading("1/64",context_id="world-1",source_id="b")
        c=compose(a,b,"XOR",relation={"kind":"observed-neighbor"})
        self.assertEqual(c["interpretation_status"],"unresolved")
        self.assertEqual(c["bits"],b.export()["bits"])
        with self.assertRaises(TypeError):
            resolve(c,lambda _:{"meaning":"made up"})
        actual={"context_id":"world-1","source_tool":"original-klein","payload":{"verified":True}}
        self.assertEqual(resolve(c,lambda _:actual),actual)
    def test_cross_context_requires_declaration(self):
        a=positional_reading("0",context_id="a",source_id="a")
        b=positional_reading("0",context_id="b",source_id="b")
        with self.assertRaises(ValueError):
            compose(a,b,"AND",relation={"kind":"contact"})
    def test_invalid_coordinates(self):
        for value in ("-1/64","1","nonsense"):
            with self.assertRaises(ValueError):
                positional_reading(value,context_id="x",source_id="y")

if __name__=="__main__":
    unittest.main()
