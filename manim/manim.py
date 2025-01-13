import marimo

__generated_with = "0.10.9"
app = marimo.App(width="medium")


@app.cell
def _():
    from manim.utils import ipython_magic
    from manim import Scene, Square, Circle, PINK, Create, Transform


    class SquareToCircle(Scene):
        def construct(self):
            square = Square()
            circle = Circle()
            circle.set_fill(PINK, opacity=0.5)
            self.play(Create(square))
            self.play(Transform(square, circle))
            self.wait()


    ipython_magic.ManimMagic({}).manim(
        """SquareToCircle""",
        None,
        {
            "SquareToCircle": SquareToCircle,
            "config": {"media_embed": True},
        },
    )
    return (
        Circle,
        Create,
        PINK,
        Scene,
        Square,
        SquareToCircle,
        Transform,
        ipython_magic,
    )


if __name__ == "__main__":
    app.run()
