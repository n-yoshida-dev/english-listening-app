import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, RotateCcw, FileText, Volume2 } from "lucide-react";

const SAMPLE_TEXT = `Topic 1: Parental Leave
My wife and I are on parental leave now. We have two daughters. Our older daughter is one and a half years old. Our younger daughter is three months old. We are very busy every day, but I am happy.

In the morning, we wake up early. We change diapers, make milk, and prepare breakfast. Sometimes the baby cries. Sometimes the older child wants to play. We take care of both children together. My wife and I help each other. That is very important.

Parental leave is not a vacation. It is real work at home. I cook, clean, do laundry, and hold the baby. I also play with my older daughter and help her sleep. At night, I am often sleepy, but I do my best.

In May, we will go back to work. I feel a little worried because our life will change again. But I think this time is very special. I can stay close to my children every day. I can see them grow little by little. That makes me very happy. I am tired, but I am thankful for this time with my family.

Topic 2: Daycare
In April, both of my daughters will start daycare. I feel happy, but I also feel nervous. It is a big change for our family.

The first month will be a settling-in period. They will stay at daycare for only a short time at first. After that, they will stay longer. I think this is good, because the children need time to get used to a new place, new teachers, and new friends.

My older daughter and my younger daughter will go to different daycare centers. This is a little hard for us. We want them to go to the same daycare in the future. That is easier for our family. It is also better if the daycare is close to our home.

I think daycare will be good for my children. They can play, learn, and spend time with other children. They can have a daily routine. They can also learn many small things from teachers and friends.

At the same time, I worry a little. Maybe they will cry. Maybe they will get sick. Maybe they will feel lonely at first. But I hope they will slowly enjoy daycare. I want them to feel safe there. I think this new step will help them grow.

Topic 3: Drop-off and Pick-up
From April, daycare drop-off and pick-up will be part of our daily life. My wife and I have different roles. My wife will take our older daughter to daycare by bicycle. I will take our younger daughter to daycare in a stroller. After that, I will come home and work remotely.

This plan is not easy. The two daycare centers are in different places. One is near Shin-Maruko Station, and the other is near Musashi-Nakahara Station. So we have to go in different directions. It takes time and energy.

I think drop-off in the morning will be busy. We have to wake up early, change clothes, prepare bottles, and get the children ready. We also need to leave home on time. If one child is in a bad mood, everything becomes difficult.

Pick-up can also be hard. Sometimes a child may be tired or sleepy. Sometimes a daycare center may call us because a child has a fever. If that happens, we must change our plan quickly.

I hope our daily routine will become smoother little by little. Right now, I feel some stress, but I want to do my best. Taking care of children is not easy, but I want to support my family every day.

Topic 4: Night Crying
My older daughter sometimes cried at night after our younger daughter was born. It was a hard time for us. Now, the baby sleeps with my wife in another room. We do this because we do not want the baby’s crying to wake up our older daughter. But I think my older daughter felt a big change in our family.

Sometimes she cried very loudly at night. It was not normal crying. She looked very upset. I was the one who usually took care of her at that time. I was very sleepy, but I had to help her calm down.

First, I tried simple things. I sang to her. I stroked her back. Sometimes that worked, and she went back to sleep. But sometimes it did not work at all. Then I had to hold her in my arms. Sitting on the bed was often not enough. I had to stand up, rock her gently, pat her back, and sing at the same time.

If she still could not calm down, I showed her her favorite anime for a short time. After twenty or thirty minutes, she finally became quiet and went back to bed. It was hard, but I wanted her to feel safe.

Topic 5: How I Calm My Child
When my daughter cries at night, I try to calm her step by step. I do not do everything at once. First, I try easy things. I talk to her in a soft voice. I sing to her. I stroke her back gently. Sometimes she feels safe again and goes back to sleep.

If that does not work, I hold her in my arms. Sometimes she wants to feel close to me. But holding her while sitting is often not enough. So I stand up and rock her slowly. I also pat her back and keep singing. This often works better.

When she is very upset, it takes a long time. I feel tired and sleepy, but I try to stay calm. If I get nervous, she may feel that too. So I try to move slowly and speak gently.

Sometimes, even that is not enough. In that case, I may show her her favorite anime for a short time. After she becomes calm, I take her back to bed. It is not easy, but I have learned that she needs comfort, time, and patience. Every child is different, so I try to find what works for her.

Topic 6: Growth
One of the best parts of parenting is seeing my children grow. Life is busy and sometimes hard, but their growth makes me very happy.

My younger daughter is still very small, but she is changing little by little. She has started to smile more. She also shows more feelings now. When I talk to her, she sometimes looks at me and smiles. That makes me very happy. I feel that she is slowly learning about the world around her.

My older daughter is also growing fast. She cannot speak clearly yet, but she makes many sounds every day. Her sounds are more like words now. I think she wants to talk to us. She also understands more than before. For example, when we say simple things, she often knows what we mean.

I like to watch these small changes. They are not big things, but they are important. A smile, a new sound, or a new action can make me very happy. Children grow step by step. Sometimes I am tired, and sometimes I worry. But when I see their growth, I feel hopeful. I want to stay close to them and support them as they grow.

Topic 7: Montessori Education
I am interested in Montessori education. I do not know everything about it, but I want to try some simple things at home. I think it is a good way for children to learn.

Recently, we ordered a small desk and chair for our child. They are child-sized, so she can sit by herself and use them easily. We are waiting for them to arrive. I am excited because I want to make a small space for her at home.

I also bought a book about Montessori education. I want to learn more. I think children can learn many things by using their hands and doing simple activities. For example, they can move small objects, open and close containers, or put things in order. These activities look simple, but they help children grow.

I want my daughter to enjoy these activities. I do not want to force her. I want her to choose, try, and learn at her own speed. I hope she can become more independent little by little.

I am also thinking about buying some educational toys. I want to choose toys that are simple and useful. I do not need many toys. I just want good ones. I hope Montessori education will help my child learn, grow, and enjoy daily life.`;

function splitTextIntoChunks(text) {
  return text
    .split(/\n+/)
    .flatMap((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return [];
      const sentences = trimmed.match(/[^.!?]+[.!?]?/g) || [trimmed];
      return sentences.map((s) => s.trim()).filter(Boolean);
    });
}

export default function ListeningPracticeReader() {
  const [text, setText] = useState("");
  const [rate, setRate] = useState([1]);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("auto");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSpeechApi, setHasSpeechApi] = useState(true);
  const utteranceRef = useRef(null);
  const chunksRef = useRef([]);

  const chunks = useMemo(() => splitTextIntoChunks(text), [text]);

  useEffect(() => {
    chunksRef.current = chunks;
    if (currentIndex >= chunks.length && chunks.length > 0) {
      setCurrentIndex(0);
    }
  }, [chunks, currentIndex]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setHasSpeechApi(false);
      return;
    }

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speakFromIndex = (startIndex) => {
    if (!hasSpeechApi || chunksRef.current.length === 0 || startIndex >= chunksRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(chunksRef.current[startIndex]);
    utterance.lang = "en-US";
    utterance.rate = rate[0];

    if (selectedVoice !== "auto") {
      const voice = voices.find((v) => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentIndex(startIndex);
    };

    utterance.onend = () => {
      const nextIndex = startIndex + 1;
      if (nextIndex < chunksRef.current.length) {
        speakFromIndex(nextIndex);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentIndex(0);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (!text.trim()) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    speakFromIndex(currentIndex);
  };

  const handlePause = () => {
    if (!isPlaying) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (hasSpeechApi) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
  };

  const handleRestart = () => {
    if (!text.trim()) return;
    setCurrentIndex(0);
    speakFromIndex(0);
  };

  const loadSample = () => {
    handleStop();
    setText(SAMPLE_TEXT);
  };

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">English Listening Reader</h1>
          <p className="text-sm text-slate-600 md:text-base">
            英文を貼り付けて読み上げ。速度は 0.5x 〜 2.0x で調整可能。7トピックのサンプルも入れてある。
          </p>
        </div>

        {!hasSpeechApi && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-sm text-red-700">
              このブラウザでは Speech Synthesis API が使えないため、読み上げ機能が動かない。
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Text Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={loadSample} variant="secondary" className="rounded-2xl">
                  7トピックのサンプルを入れる
                </Button>
                <Button
                  onClick={() => {
                    handleStop();
                    setText("");
                  }}
                  variant="outline"
                  className="rounded-2xl"
                >
                  クリア
                </Button>
              </div>

              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ここに英文を貼り付ける"
                className="min-h-[380px] rounded-2xl text-sm leading-6"
              />

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <Badge variant="secondary" className="rounded-xl px-3 py-1">
                  Chunks: {chunks.length}
                </Badge>
                <Badge variant="secondary" className="rounded-xl px-3 py-1">
                  Words: {text.trim() ? text.trim().split(/\s+/).length : 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Volume2 className="h-5 w-5" />
                  Playback Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>再生速度</Label>
                    <span className="text-sm font-medium">{rate[0].toFixed(1)}x</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={rate}
                    onValueChange={setRate}
                  />
                  <p className="text-xs text-slate-500">
                    読み上げ中に速度を変えた場合、次の文から反映される。
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>音声</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="音声を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (default)</SelectItem>
                      {englishVoices.map((voice) => (
                        <SelectItem key={`${voice.name}-${voice.lang}`} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handlePlay} disabled={!text.trim()} className="rounded-2xl">
                    <Play className="mr-2 h-4 w-4" />
                    {isPaused ? "再開" : "再生"}
                  </Button>
                  <Button onClick={handlePause} disabled={!isPlaying} variant="secondary" className="rounded-2xl">
                    <Pause className="mr-2 h-4 w-4" />
                    一時停止
                  </Button>
                  <Button onClick={handleStop} variant="outline" className="rounded-2xl">
                    <Square className="mr-2 h-4 w-4" />
                    停止
                  </Button>
                  <Button onClick={handleRestart} disabled={!text.trim()} variant="outline" className="rounded-2xl">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    最初から
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>現在の文</span>
                  <span className="font-medium">
                    {chunks.length === 0 ? 0 : Math.min(currentIndex + 1, chunks.length)} / {chunks.length}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{ width: `${chunks.length === 0 ? 0 : ((Math.min(currentIndex, chunks.length) / chunks.length) * 100).toFixed(1)}%` }}
                  />
                </div>
                <div className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
                  {chunks.length === 0 ? (
                    <span className="text-slate-500">ここに現在読んでいる文が表示される。</span>
                  ) : (
                    chunks[currentIndex] || chunks[0]
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
